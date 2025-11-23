import cron from 'node-cron';
import { syncAllEntitiesForCompany } from '../utils/jiraSync.js';
import { Company } from '../models/Company.js';

// Sync service for automated synchronization
class JiraSyncService {
  constructor() {
    this.isRunning = false;
    this.syncJobs = new Map();
  }

  // Start periodic sync for all companies
  startPeriodicSync(cronExpression = '*/5 * * * *') { // Every 5 minutes by default for near-instant sync
    if (this.isRunning) {
      console.log('Periodic sync is already running');
      return;
    }

    console.log(`🚀 Starting INSTANT Jira sync with cron: ${cronExpression} (every 5 minutes)`);

    this.isRunning = true;

    // Schedule the sync job
    const job = cron.schedule(cronExpression, async () => {
      console.log('🔄 Running scheduled sync check...');
      await this.syncAllCompanies();
    });

    this.syncJobs.set('periodic', job);
  }

  // Stop periodic sync
  stopPeriodicSync() {
    const job = this.syncJobs.get('periodic');
    if (job) {
      job.stop();
      this.syncJobs.delete('periodic');
    }
    this.isRunning = false;
    console.log('Periodic sync stopped');
  }

  // Sync all active companies
  async syncAllCompanies() {
    try {
      console.log('Starting sync for all companies');

      const companies = await Company.find({ isActive: true });
      console.log(`Found ${companies.length} active companies to sync`);

      for (const company of companies) {
        try {
          console.log(`Syncing company: ${company.name} (${company._id})`);
          await syncAllEntitiesForCompany(company._id.toString());
          console.log(`Completed sync for company: ${company.name}`);
        } catch (error) {
          console.error(`Error syncing company ${company.name}:`, error);
          // Continue with other companies even if one fails
        }
      }

      console.log('Completed sync for all companies');
    } catch (error) {
      console.error('Error in syncAllCompanies:', error);
    }
  }

  // Sync a specific company immediately
  async syncCompany(companyId) {
    try {
      console.log(`Starting immediate sync for company ${companyId}`);
      await syncAllEntitiesForCompany(companyId);
      console.log(`Completed immediate sync for company ${companyId}`);
    } catch (error) {
      console.error(`Error in immediate sync for company ${companyId}:`, error);
      throw error;
    }
  }

  // Get sync status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.syncJobs.keys())
    };
  }
}

// Export singleton instance
export const jiraSyncService = new JiraSyncService();