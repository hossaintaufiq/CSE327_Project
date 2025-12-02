import mongoose from 'mongoose';
import { Client } from '../models/Client.js';
import { User } from '../models/User.js';
import { createIssue } from '../jiraClient.js';
import { createNotificationForStatusChange } from '../services/notificationService.js';
import * as clientService from '../services/clientService.js';

export const getClients = async (req, res) => {
  try {
    const companyId = req.companyId;
    const user = req.user;
    const userRole = req.companyRole;

    let query = { companyId, isActive: true };

    // Employees can only see clients assigned to them
    if (userRole === 'employee') {
      query.assignedTo = user._id;
    }

    const clients = await Client.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { clients },
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
};

export const getClientById = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { id } = req.params;
    const user = req.user;
    const userRole = req.companyRole;

    const client = await Client.findOne({ _id: id, companyId, isActive: true })
      .populate('assignedTo', 'name email')
      .lean();

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Employees can only access clients assigned to them
    if (userRole === 'employee' && client.assignedTo?._id?.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      data: { client },
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: 'Error fetching client', error: error.message });
  }
};

export const createClient = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { name, email, phone, address, company, assignedTo, status, notes } = req.body;

    // Only require name - email is optional for leads
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Create client with static data - no validation on company field or email uniqueness
    // The company field is just text for the lead's external company name
    const client = await Client.create({
      companyId,
      name: name.trim(),
      email: email?.trim() || '', // Allow empty email
      phone: phone?.trim() || '',
      address: address?.trim() || '',
      company: company?.trim() || '', // Lead's company - just text, no validation
      assignedTo: assignedTo || null,
      status: status || 'lead',
      notes: notes?.trim() || '',
    });

    await client.populate('assignedTo', 'name email');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: { client },
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ message: 'Error creating lead', error: error.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { id } = req.params;
    const { name, email, phone, address, company, assignedTo, status, notes } = req.body;
    const userRole = req.companyRole;

    const client = await Client.findOne({ _id: id, companyId, isActive: true });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Employees can only update clients assigned to them
    if (userRole === 'employee' && client.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if email is being changed and if it conflicts
    if (email && email !== client.email) {
      const existingClient = await Client.findOne({ companyId, email, isActive: true, _id: { $ne: id } });
      if (existingClient) {
        return res.status(400).json({ message: 'Client with this email already exists' });
      }
    }

    // Update fields
    if (name) client.name = name;
    if (email) client.email = email;
    if (phone !== undefined) client.phone = phone;
    if (address !== undefined) client.address = address;
    if (company !== undefined) client.company = company;
    if (assignedTo !== undefined) client.assignedTo = assignedTo || null;
    if (status) client.status = status;
    if (notes !== undefined) client.notes = notes;

    await client.save();
    await client.populate('assignedTo', 'name email');

    // Sync with Jira if status changed or other important fields updated
    try {
      const oldStatus = client.status; // Store old status before potential change
      const statusChanged = status !== undefined && status !== client.status;
      const importantFieldsChanged = name !== undefined || email !== undefined || notes !== undefined;

      if (statusChanged) {
        await syncStatusToJira('client', client, client.status);
        // Create notification for manual status change
        await createNotificationForStatusChange('client', client, client.status);
      }

      if (importantFieldsChanged) {
        await updateJiraIssue('client', client);
      }
    } catch (syncError) {
      console.error('Error syncing client to Jira:', syncError);
      // Don't fail the update if sync fails, just log it
    }

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: { client },
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ message: 'Error updating client', error: error.message });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { id } = req.params;
    const userRole = req.companyRole;

    const client = await Client.findOne({ _id: id, companyId, isActive: true });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Only admins and managers can delete
    if (userRole !== 'company_admin' && userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    client.isActive = false;
    await client.save();

    // Clean up Jira references for the deleted client
    try {
      await cleanupJiraReferencesOnEntityDeletion('client', id);
    } catch (cleanupError) {
      console.error('Error cleaning up Jira references:', cleanupError);
      // Don't fail the deletion if cleanup fails
    }

    res.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Error deleting client', error: error.message });
  }
};

/**
 * Create a Jira issue linked to a client
 */
export const createJiraIssueForClient = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId;
    const { summary, description, issuetype = 'Bug' } = req.body;

    // Find the client
    const client = await Client.findOne({ _id: id, companyId, isActive: true });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Create Jira issue
    const jiraIssueData = {
      summary: summary || `Support: ${client.name}`,
      description: description || `Client: ${client.name}\nEmail: ${client.email}\nPhone: ${client.phone}\nIssue: ${description || 'Support request'}`,
      issuetype,
    };

    const jiraIssue = await createIssue(jiraIssueData);

    // Link Jira issue to client
    const jiraIssueLink = {
      issueKey: jiraIssue.key,
      issueUrl: `${process.env.JIRA_BASE_URL}/browse/${jiraIssue.key}`,
      createdAt: new Date(),
    };

    client.jiraIssues.push(jiraIssueLink);
    await client.save();

    res.json({
      success: true,
      message: 'Jira issue created and linked to client',
      data: {
        jiraIssue,
        client: {
          id: client._id,
          name: client.name,
          jiraIssues: client.jiraIssues,
        },
      },
    });
  } catch (error) {
    console.error('Error creating Jira issue for client:', error);
    res.status(500).json({ message: 'Error creating Jira issue', error: error.message });
  }
};

/**
 * Convert a lead to a customer
 * POST /api/clients/:id/convert
 * 
 * This is a thin controller that delegates to clientService (MVC pattern)
 */
export const convertLeadToClient = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId;
    const userId = req.user._id;
    const additionalData = req.body; // Optional: email, phone, address, notes

    const client = await clientService.convertLeadToClient({
      leadId: id,
      companyId,
      convertedBy: userId,
      additionalData,
    });

    res.json({
      success: true,
      message: 'Lead successfully converted to customer',
      data: { client },
    });
  } catch (error) {
    console.error('Error converting lead to client:', error);
    const status = error.status || 500;
    res.status(status).json({ 
      success: false,
      error: {
        code: error.code || 'SERVER_ERROR',
        message: error.message || 'Error converting lead to customer',
      }
    });
  }
};

