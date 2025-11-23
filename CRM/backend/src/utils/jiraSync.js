import { createIssue, addComment, getTransitions, transitionIssue } from '../jiraClient.js';

// Status mappings between CRM and Jira
export const STATUS_MAPPINGS = {
  task: {
    // CRM status -> Jira transition name
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'In Review',
    done: 'Done',
    cancelled: 'Cancelled'
  },
  project: {
    planning: 'To Do',
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    completed: 'Done',
    cancelled: 'Cancelled'
  },
  order: {
    pending: 'To Do',
    processing: 'In Progress',
    shipped: 'In Review',
    delivered: 'Done',
    cancelled: 'Cancelled'
  },
  client: {
    lead: 'To Do',
    active: 'In Progress',
    inactive: 'On Hold',
    customer: 'Done'
  }
};

// Sync CRM entity status to Jira
export const syncStatusToJira = async (entityType, entity, newStatus) => {
  console.log(`🔄 Starting syncStatusToJira for ${entityType} ${entity._id}, new status: ${newStatus}`);
  
  if (!entity.jiraIssues || entity.jiraIssues.length === 0) {
    console.log(`⚠️ No Jira issues linked to ${entityType}, skipping sync`);
    return;
  }

  const mapping = STATUS_MAPPINGS[entityType];
  if (!mapping) {
    console.log(`⚠️ No status mapping found for ${entityType}`);
    return;
  }

  const jiraTransition = mapping[newStatus];
  if (!jiraTransition) {
    console.log(`⚠️ No Jira transition mapped for ${entityType} status: ${newStatus}`);
    return;
  }

  try {
    console.log(`📝 Transitioning ${entity.jiraIssues.length} Jira issues to: ${jiraTransition}`);
    
    // Update all linked Jira issues
    for (const jiraIssue of entity.jiraIssues) {
      console.log(`🔄 Transitioning issue ${jiraIssue.issueKey} to ${jiraTransition}`);
      await transitionIssue(jiraIssue.issueKey, { transitionName: jiraTransition });

      // Add a comment to track the sync (don't fail if comment fails)
      try {
        const comment = `Status updated from CRM: ${newStatus}`;
        await addComment(jiraIssue.issueKey, comment);
        console.log(`💬 Added sync comment to ${jiraIssue.issueKey}`);
      } catch (commentError) {
        console.warn(`⚠️ Failed to add comment to ${jiraIssue.issueKey}, but status was updated:`, commentError.message);
        // Don't fail the entire sync if comment fails
      }
    }

    console.log(`✅ Successfully synced ${entityType} status to Jira`);
  } catch (error) {
    console.error(`❌ Error syncing ${entityType} status to Jira:`, error);
    throw error;
  }
};

// Update Jira issue details when CRM entity is updated
export const updateJiraIssue = async (entityType, entity) => {
  if (!entity.jiraIssues || entity.jiraIssues.length === 0) {
    return;
  }

  try {
    // For now, we'll add comments to track updates
    // In a full implementation, you might want to update the issue fields
    const updateComment = `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} updated in CRM:
- Title/Name: ${entity.title || entity.name || entity.orderNumber}
- Status: ${entity.status}
- Updated: ${new Date().toISOString()}`;

    for (const jiraIssue of entity.jiraIssues) {
      try {
        await addComment(jiraIssue.issueKey, updateComment);
        console.log(`💬 Added update comment to ${jiraIssue.issueKey}`);
      } catch (commentError) {
        console.warn(`⚠️ Failed to add update comment to ${jiraIssue.issueKey}:`, commentError.message);
        // Continue with other issues even if one comment fails
      }
    }

    console.log(`Updated Jira issues for ${entityType}`);
  } catch (error) {
    console.error(`Error updating Jira issues for ${entityType}:`, error);
    throw error;
  }
};

// Sync all entities for a company (useful for initial sync or periodic sync)
export const syncAllEntitiesForCompany = async (companyId) => {
  const { Task } = await import('../models/Task.js');
  const { Project } = await import('../models/Project.js');
  const { Order } = await import('../models/Order.js');
  const { Client } = await import('../models/Client.js');

  console.log(`Starting full sync for company ${companyId}`);

  try {
    // Sync tasks (only active ones)
    const tasks = await Task.find({ companyId, isActive: true });
    for (const task of tasks) {
      if (task.jiraIssues && task.jiraIssues.length > 0) {
        await syncStatusToJira('task', task, task.status);
      }
    }

    // Sync projects (only active ones)
    const projects = await Project.find({ companyId, isActive: true });
    for (const project of projects) {
      if (project.jiraIssues && project.jiraIssues.length > 0) {
        await syncStatusToJira('project', project, project.status);
      }
    }

    // Sync orders (orders don't have isActive field, so sync all)
    const orders = await Order.find({ companyId });
    for (const order of orders) {
      if (order.jiraIssues && order.jiraIssues.length > 0) {
        await syncStatusToJira('order', order, order.status);
      }
    }

    // Sync clients (only active ones)
    const clients = await Client.find({ companyId, isActive: true });
    for (const client of clients) {
      if (client.jiraIssues && client.jiraIssues.length > 0) {
        await syncStatusToJira('client', client, client.status);
      }
    }

    console.log(`Completed full sync for company ${companyId}`);
  } catch (error) {
    console.error(`Error during full sync for company ${companyId}:`, error);
    throw error;
  }
};

// Handle Jira webhook updates (when Jira issues are updated)
export const handleJiraWebhook = async (webhookData) => {
  console.log(`🎣 Received Jira webhook:`, JSON.stringify(webhookData, null, 2));

  const { issue, webhookEvent } = webhookData;
  if (!issue) {
    console.log(`⚠️ No issue data in webhook`);
    return;
  }

  const issueKey = issue.key;

  // Handle issue deletion
  if (webhookEvent === 'jira:issue_deleted') {
    console.log(`🗑️ Processing Jira issue deletion for ${issueKey}`);
    await handleJiraIssueDeletion(issueKey);
    return;
  }

  const newStatus = issue.fields.status?.name;

  console.log(`🔄 Processing Jira webhook for issue ${issueKey}, new status: ${newStatus}`);

  try {
    // Find the CRM entity linked to this Jira issue
    const { Task } = await import('../models/Task.js');
    const { Project } = await import('../models/Project.js');
    const { Order } = await import('../models/Order.js');
    const { Client } = await import('../models/Client.js');

    // Check each entity type
    const entities = [
      { model: Task, type: 'task', statusField: 'status' },
      { model: Project, type: 'project', statusField: 'status' },
      { model: Order, type: 'order', statusField: 'status' },
      { model: Client, type: 'client', statusField: 'status' }
    ];

    let foundEntity = null;
    let entityType = null;

    for (const { model, type, statusField } of entities) {
      console.log(`🔍 Searching for ${type} with Jira issue ${issueKey}`);
      const entity = await model.findOne({
        jiraIssues: { $elemMatch: { issueKey } }
      });

      if (entity) {
        foundEntity = entity;
        entityType = type;
        console.log(`✅ Found ${type} ${entity._id} linked to Jira issue ${issueKey}`);
        break;
      }
    }

    if (!foundEntity) {
      console.log(`⚠️ No CRM entity found linked to Jira issue ${issueKey}`);
      return;
    }

    // Map Jira status back to CRM status
    const crmStatus = mapJiraStatusToCRM(entityType, newStatus);
    console.log(`🔄 Mapping Jira status "${newStatus}" to CRM status "${crmStatus}" for ${entityType}`);
    
    if (crmStatus && crmStatus !== foundEntity.status) {
      foundEntity.status = crmStatus;
      await foundEntity.save();
      console.log(`✅ Updated ${entityType} ${foundEntity._id} status to ${crmStatus} from Jira`);
    } else {
      console.log(`⚠️ No status update needed for ${entityType} ${foundEntity._id}`);
    }
  } catch (error) {
    console.error('❌ Error handling Jira webhook:', error);
    throw error;
  }
};

// Handle Jira issue deletion - remove the issue reference from CRM entities
export const handleJiraIssueDeletion = async (issueKey) => {
  console.log(`🗑️ Handling deletion of Jira issue ${issueKey}`);

  try {
    const { Task } = await import('../models/Task.js');
    const { Project } = await import('../models/Project.js');
    const { Order } = await import('../models/Order.js');
    const { Client } = await import('../models/Client.js');

    const entities = [
      { model: Task, type: 'task' },
      { model: Project, type: 'project' },
      { model: Order, type: 'order' },
      { model: Client, type: 'client' }
    ];

    let updatedCount = 0;

    for (const { model, type } of entities) {
      // Remove the deleted Jira issue from the entity's jiraIssues array
      const result = await model.updateMany(
        { 'jiraIssues.issueKey': issueKey },
        { $pull: { jiraIssues: { issueKey } } }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Removed Jira issue ${issueKey} from ${result.modifiedCount} ${type}(s)`);
        updatedCount += result.modifiedCount;
      }
    }

    if (updatedCount === 0) {
      console.log(`⚠️ No CRM entities found linked to deleted Jira issue ${issueKey}`);
    } else {
      console.log(`✅ Successfully cleaned up references to deleted Jira issue ${issueKey} from ${updatedCount} entities`);
    }
  } catch (error) {
    console.error(`❌ Error handling Jira issue deletion for ${issueKey}:`, error);
    throw error;
  }
};

// Clean up Jira issue references when a CRM entity is deleted (soft delete)
export const cleanupJiraReferencesOnEntityDeletion = async (entityType, entityId) => {
  console.log(`🧹 Cleaning up Jira references for deleted ${entityType} ${entityId}`);

  try {
    const { Task } = await import('../models/Task.js');
    const { Project } = await import('../models/Project.js');
    const { Order } = await import('../models/Order.js');
    const { Client } = await import('../models/Client.js');

    let model;
    switch (entityType) {
      case 'task':
        model = Task;
        break;
      case 'project':
        model = Project;
        break;
      case 'order':
        model = Order;
        break;
      case 'client':
        model = Client;
        break;
      default:
        console.log(`⚠️ Unknown entity type: ${entityType}`);
        return;
    }

    // Find the entity to get its Jira issues
    const entity = await model.findById(entityId);
    if (!entity || !entity.jiraIssues || entity.jiraIssues.length === 0) {
      console.log(`⚠️ No Jira issues found for ${entityType} ${entityId}`);
      return;
    }

    // Note: We don't delete the Jira issues themselves when CRM entities are deleted
    // This is because the business logic might want to keep Jira issues even if CRM entities are removed
    // However, we could add this functionality if needed

    console.log(`ℹ️ ${entityType} ${entityId} has ${entity.jiraIssues.length} linked Jira issue(s). References will remain in Jira.`);
  } catch (error) {
    console.error(`❌ Error cleaning up Jira references for ${entityType} ${entityId}:`, error);
    throw error;
  }
};

// Clean up orphaned Jira references (Jira issues that no longer exist)
export const cleanupOrphanedJiraReferences = async (companyId) => {
  console.log(`🧽 Starting cleanup of orphaned Jira references for company ${companyId}`);

  try {
    const { Task } = await import('../models/Task.js');
    const { Project } = await import('../models/Project.js');
    const { Order } = await import('../models/Order.js');
    const { Client } = await import('../models/Client.js');

    const entities = [
      { model: Task, type: 'task', activeFilter: { companyId, isActive: true } },
      { model: Project, type: 'project', activeFilter: { companyId, isActive: true } },
      { model: Order, type: 'order', activeFilter: { companyId } },
      { model: Client, type: 'client', activeFilter: { companyId, isActive: true } }
    ];

    let totalCleaned = 0;

    for (const { model, type, activeFilter } of entities) {
      const entitiesWithJiraIssues = await model.find(activeFilter).select('jiraIssues');

      for (const entity of entitiesWithJiraIssues) {
        if (!entity.jiraIssues || entity.jiraIssues.length === 0) continue;

        const validIssues = [];

        for (const jiraIssue of entity.jiraIssues) {
          try {
            // Try to fetch the issue from Jira to check if it still exists
            const { getIssue } = await import('../jiraClient.js');
            await getIssue(jiraIssue.issueKey);
            validIssues.push(jiraIssue); // Issue still exists
          } catch (error) {
            if (error.response?.status === 404) {
              console.log(`🗑️ Removing reference to deleted Jira issue ${jiraIssue.issueKey} from ${type} ${entity._id}`);
            } else {
              console.error(`Error checking Jira issue ${jiraIssue.issueKey}:`, error.message);
              validIssues.push(jiraIssue); // Keep it if we can't verify
            }
          }
        }

        if (validIssues.length !== entity.jiraIssues.length) {
          entity.jiraIssues = validIssues;
          await entity.save();
          const removedCount = entity.jiraIssues.length - validIssues.length;
          totalCleaned += removedCount;
          console.log(`✅ Cleaned ${removedCount} orphaned references from ${type} ${entity._id}`);
        }
      }
    }

    console.log(`🧽 Completed cleanup of orphaned Jira references. Total cleaned: ${totalCleaned}`);
    return totalCleaned;
  } catch (error) {
    console.error('❌ Error during orphaned reference cleanup:', error);
    throw error;
  }
};