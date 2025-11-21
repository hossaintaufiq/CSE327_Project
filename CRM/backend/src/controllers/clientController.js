import mongoose from 'mongoose';
import { Client } from '../models/Client.js';
import { User } from '../models/User.js';

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

    res.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Error deleting client', error: error.message });
  }
};

