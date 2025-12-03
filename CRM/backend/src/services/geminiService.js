/**
 * Gemini AI Service
 * 
 * Provides AI-powered features using Google's Gemini API:
 * - Smart suggestions for tasks, projects, clients
 * - Content generation (emails, descriptions, summaries)
 * - Data analysis and insights
 * - Natural language processing for CRM operations
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Model configuration - using the latest available model
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Get configured Gemini model
 * @returns {GenerativeModel} Configured model instance
 */
function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return genAI.getGenerativeModel({ model: MODEL_NAME });
}

/**
 * Generate text content using Gemini
 * @param {string} prompt - The prompt to generate from
 * @param {Object} [options] - Generation options
 * @returns {Promise<string>} Generated text
 */
export async function generateText(prompt, options = {}) {
  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini generateText error:', error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Summarize text content
 * @param {string} content - Content to summarize
 * @param {number} [maxLength=200] - Maximum summary length
 * @returns {Promise<string>} Summary
 */
export async function summarize(content, maxLength = 200) {
  const prompt = `Summarize the following content in ${maxLength} characters or less. Be concise and capture key points:\n\n${content}`;
  return generateText(prompt);
}

/**
 * Generate task suggestions based on project context
 * @param {Object} project - Project data
 * @param {Array} existingTasks - Existing tasks in the project
 * @returns {Promise<Array>} Suggested tasks
 */
export async function suggestTasks(project, existingTasks = []) {
  const existingTaskTitles = existingTasks.map(t => t.title).join(', ');
  
  const prompt = `You are a project management AI assistant. Based on the following project, suggest 3-5 new tasks that would help complete this project successfully.

Project Name: ${project.name}
Project Description: ${project.description || 'No description'}
Current Status: ${project.status}
Existing Tasks: ${existingTaskTitles || 'None'}

Respond with a JSON array of task objects with these fields:
- title: string (concise task title)
- description: string (brief description)
- priority: string (low, medium, high, urgent)
- estimatedHours: number

Only respond with valid JSON array, no additional text.`;

  try {
    const response = await generateText(prompt);
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Error parsing task suggestions:', error);
    return [];
  }
}

/**
 * Generate email draft for client communication
 * @param {Object} params - Email parameters
 * @param {string} params.clientName - Client name
 * @param {string} params.purpose - Purpose of email (follow-up, update, proposal, etc.)
 * @param {string} [params.context] - Additional context
 * @param {string} [params.tone] - Tone (professional, friendly, formal)
 * @returns {Promise<Object>} Email draft with subject and body
 */
export async function generateEmailDraft({ clientName, purpose, context = '', tone = 'professional' }) {
  const prompt = `Generate a ${tone} business email for the following:

Client Name: ${clientName}
Purpose: ${purpose}
Additional Context: ${context || 'None provided'}

Respond with a JSON object containing:
- subject: string (email subject line)
- body: string (email body, use \\n for line breaks)

Only respond with valid JSON, no additional text.`;

  try {
    const response = await generateText(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { subject: '', body: '' };
  } catch (error) {
    console.error('Error generating email draft:', error);
    return { subject: '', body: '' };
  }
}

/**
 * Analyze client data and provide insights
 * @param {Object} clientData - Client information and history
 * @returns {Promise<Object>} Analysis and recommendations
 */
export async function analyzeClient(clientData) {
  const prompt = `Analyze the following CRM client data and provide actionable insights:

Client: ${clientData.name}
Status: ${clientData.status}
Company: ${clientData.company || 'N/A'}
Orders: ${clientData.orderCount || 0} orders, Total Value: $${clientData.totalValue || 0}
Last Contact: ${clientData.lastContact || 'Unknown'}
Notes: ${clientData.notes || 'None'}

Provide analysis as JSON with:
- healthScore: number (1-100, client relationship health)
- riskLevel: string (low, medium, high)
- recommendations: array of strings (3-5 actionable recommendations)
- nextBestAction: string (single most important action)

Only respond with valid JSON, no additional text.`;

  try {
    const response = await generateText(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { healthScore: 50, riskLevel: 'medium', recommendations: [], nextBestAction: '' };
  } catch (error) {
    console.error('Error analyzing client:', error);
    return { healthScore: 50, riskLevel: 'medium', recommendations: [], nextBestAction: '' };
  }
}

/**
 * Smart search - convert natural language to structured query
 * @param {string} query - Natural language query
 * @param {string} entityType - Type of entity (client, order, task, project)
 * @returns {Promise<Object>} Structured search filters
 */
export async function smartSearch(query, entityType) {
  const prompt = `Convert this natural language search query into structured filters for a ${entityType} search in a CRM system:

Query: "${query}"

Respond with a JSON object containing MongoDB-compatible filter fields. Common fields:
- For clients: name, email, status (active/inactive/lead), company
- For orders: status (pending/processing/shipped/delivered/cancelled), totalAmount
- For tasks: status (todo/in_progress/review/done), priority (low/medium/high/urgent), dueDate
- For projects: status (planning/in_progress/on_hold/completed), priority

Use $regex for text searches, $gte/$lte for ranges. Only respond with valid JSON.`;

  try {
    const response = await generateText(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch (error) {
    console.error('Error in smart search:', error);
    return {};
  }
}

/**
 * Generate project description from brief input
 * @param {string} title - Project title
 * @param {string} briefDescription - Brief description or keywords
 * @returns {Promise<string>} Detailed project description
 */
export async function generateProjectDescription(title, briefDescription) {
  const prompt = `Generate a professional, detailed project description for a CRM project:

Title: ${title}
Brief: ${briefDescription}

Write 2-3 paragraphs covering:
1. Project overview and objectives
2. Key deliverables and scope
3. Expected outcomes

Keep it professional and suitable for a business CRM system. Plain text only.`;

  return generateText(prompt);
}

/**
 * Suggest response for client message
 * @param {string} clientMessage - Message from client
 * @param {Object} context - Context about client/conversation
 * @returns {Promise<Array>} Array of suggested responses
 */
export async function suggestResponses(clientMessage, context = {}) {
  const prompt = `Suggest 3 professional responses to this client message in a CRM context:

Client Message: "${clientMessage}"
Client Name: ${context.clientName || 'the client'}
Context: ${context.conversationContext || 'General inquiry'}

Respond with a JSON array of 3 response strings, from most formal to most friendly.
Only respond with valid JSON array.`;

  try {
    const response = await generateText(prompt);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Error suggesting responses:', error);
    return [];
  }
}

/**
 * Generate company dashboard insights and recommendations
 * @param {Object} companyData - Company dashboard statistics and data
 * @returns {Promise<Object>} AI-generated insights with tips and recommendations
 */
export async function generateCompanyInsights(companyData) {
  const prompt = `You are an expert business analyst AI assistant. Analyze the following company CRM data and provide actionable insights to improve sales and management:

COMPANY STATISTICS:
- Monthly Revenue: $${companyData.monthlyRevenue || 0}
- Total Revenue: $${companyData.totalRevenue || 0}
- New Leads (30 days): ${companyData.newLeads30d || 0}
- Total Clients: ${companyData.totalClients || 0}
- Total Orders: ${companyData.totalOrders || 0}
- Pipeline Value: $${companyData.pipelineValue || 0}
- Active Tasks: ${companyData.activeTasks || 0}
- Total Employees: ${companyData.totalEmployees || 0}
- Average Deal Size: $${companyData.avgDealSize || 0}
- Conversion Rate: ${companyData.conversionRate?.toFixed(2) || 0}%
- Revenue Trend (last 6 months): ${JSON.stringify(companyData.revenueTrend || [])}

Provide a comprehensive analysis as a JSON object with the following structure:
{
  "overallHealthScore": number (1-100, overall business health),
  "salesPerformance": {
    "score": number (1-100),
    "strengths": array of 2-3 strings,
    "weaknesses": array of 2-3 strings,
    "trend": "improving" | "stable" | "declining"
  },
  "managementPerformance": {
    "score": number (1-100),
    "strengths": array of 2-3 strings,
    "weaknesses": array of 2-3 strings,
    "trend": "improving" | "stable" | "declining"
  },
  "recommendations": array of objects, each with:
    - "category": string (e.g., "Sales", "Marketing", "Operations", "Growth"),
    - "priority": "high" | "medium" | "low",
    - "tip": string (actionable advice)
  "quickTips": array of 3-5 strings (brief actionable tips),
  "keyMetrics": {
    "needsAttention": array of 2-3 strings (metrics that need improvement),
    "performingWell": array of 2-3 strings (metrics performing well)
  }
}

Only respond with valid JSON, no additional text or markdown formatting.`;

  try {
    const response = await generateText(prompt);
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const insights = JSON.parse(jsonMatch[0]);
      return insights;
    }
    // Fallback if JSON parsing fails
    return {
      overallHealthScore: 70,
      salesPerformance: { score: 70, strengths: [], weaknesses: [], trend: "stable" },
      managementPerformance: { score: 70, strengths: [], weaknesses: [], trend: "stable" },
      recommendations: [],
      quickTips: [],
      keyMetrics: { needsAttention: [], performingWell: [] }
    };
  } catch (error) {
    console.error('Error generating company insights:', error);
    throw new Error(`Failed to generate insights: ${error.message}`);
  }
}

/**
 * Check if Gemini service is configured and available
 * @returns {Promise<boolean>} Service availability status
 */
export async function checkHealth() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { available: false, reason: 'API key not configured' };
    }
    
    const model = getModel();
    const result = await model.generateContent('Say "ok" if you can read this.');
    const text = (await result.response).text();
    
    return { available: true, model: MODEL_NAME, response: text.substring(0, 50) };
  } catch (error) {
    return { available: false, reason: error.message };
  }
}

export default {
  generateText,
  summarize,
  suggestTasks,
  generateEmailDraft,
  analyzeClient,
  smartSearch,
  generateProjectDescription,
  suggestResponses,
  checkHealth,
  generateCompanyInsights,
};
