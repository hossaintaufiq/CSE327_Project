/**
 * Services Index
 * 
 * Central export point for all service modules.
 * This allows for cleaner imports:
 * 
 * import { clientService, orderService, projectService, taskService } from '../services/index.js';
 */

export * as clientService from './clientService.js';
export * as orderService from './orderService.js';
export * as projectService from './projectService.js';
export * as taskService from './taskService.js';
export * as emailService from './emailService.js';
export * as notificationService from './notificationService.js';
export * as jiraSyncService from './jiraSyncService.js';
export * as geminiService from './geminiService.js';
export * as liveChatService from './liveChatService.js';
export * as mcpServer from './mcpServer.js';
export * as pipelineService from './pipelineService.js';
export * as voiceChatService from './voiceChatService.js';

// Default export for convenience
export default {
  clientService: () => import('./clientService.js'),
  orderService: () => import('./orderService.js'),
  projectService: () => import('./projectService.js'),
  taskService: () => import('./taskService.js'),
  emailService: () => import('./emailService.js'),
  notificationService: () => import('./notificationService.js'),
  jiraSyncService: () => import('./jiraSyncService.js'),
  geminiService: () => import('./geminiService.js'),
  liveChatService: () => import('./liveChatService.js'),
  mcpServer: () => import('./mcpServer.js'),
  pipelineService: () => import('./pipelineService.js'),
  voiceChatService: () => import('./voiceChatService.js'),
};
