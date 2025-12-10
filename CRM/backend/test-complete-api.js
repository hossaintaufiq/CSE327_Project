/**
 * Complete API Test Suite
 * Tests all major API endpoints with generated credentials
 * 
 * Prerequisites:
 * 1. Run: node test-credentials-generator.js --login email password
 * 2. Ensure server is running: npm start
 * 3. Run tests: node test-complete-api.js
 */

import fetch from 'node-fetch';
import fs from 'fs';

// Color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '═'.repeat(70), 'blue');
  log(`  ${title}`, 'bold');
  log('═'.repeat(70), 'blue');
}

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

function logTest(name, passed, details = '', skipped = false) {
  if (skipped) {
    log(`  ⏭️  SKIP: ${name}`, 'yellow');
    log(`    Reason: ${details}`, 'cyan');
    results.skipped++;
    results.tests.push({ name, passed: null, details, skipped: true });
    return;
  }

  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? 'green' : 'red';
  log(`  ${status}: ${name}`, color);
  if (details) {
    const detailColor = passed ? 'cyan' : 'yellow';
    log(`    ${details}`, detailColor);
  }
  results.tests.push({ name, passed, details, skipped: false });
  if (passed) results.passed++;
  else results.failed++;
}

// Load test configuration
let testConfig;
try {
  testConfig = JSON.parse(fs.readFileSync('./test-config.json', 'utf-8'));
} catch (error) {
  log('❌ test-config.json not found!', 'red');
  log('   Please run: node test-credentials-generator.js --login email password', 'yellow');
  process.exit(1);
}

const BASE_URL = testConfig.baseURL || 'http://localhost:5000/api';
const TOKEN = testConfig.token;

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (TOKEN && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${TOKEN}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      timeout: testConfig.timeout || 10000
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return { response, data, ok: response.ok, status: response.status };
  } catch (error) {
    return { response: null, data: null, ok: false, error: error.message };
  }
}

// ============ Test Suites ============

async function testServerHealth() {
  logSection('🏥 SERVER HEALTH TESTS');

  // Test 1: Health endpoint
  const health = await apiCall('/health', { skipAuth: true });
  logTest(
    'Server health check',
    health.ok,
    health.ok ? `Status: ${health.data?.status || 'OK'}` : `Error: ${health.error || 'Server not responding'}`
  );

  // Test 2: Database connection
  if (health.ok && health.data?.database) {
    logTest('Database connection', health.data.database === 'connected', 
      `Database: ${health.data.database}`);
  }
}

async function testAuthentication() {
  logSection('🔐 AUTHENTICATION TESTS');

  if (!TOKEN) {
    logTest('Auth token available', false, 'No token in test-config.json. Run with --login flag', true);
    return;
  }

  logTest('Auth token available', true, `Token length: ${TOKEN.length}`);

  // Test protected endpoint
  const authTest = await apiCall('/conversations/my-conversations');
  logTest(
    'Protected endpoint access',
    authTest.ok,
    authTest.ok ? `Success: ${authTest.status}` : `Failed: ${authTest.status} - ${authTest.data?.message || authTest.error}`
  );
}

async function testConversations() {
  logSection('💬 CONVERSATION TESTS');

  if (!TOKEN) {
    logTest('Conversations tests', false, 'Token required', true);
    return;
  }

  // Test 1: Get my conversations
  const myConvos = await apiCall('/conversations/my-conversations');
  logTest(
    'Get my conversations',
    myConvos.ok,
    myConvos.ok ? `Found ${myConvos.data?.data?.total || 0} conversations` : `Error: ${myConvos.data?.message || myConvos.error}`
  );

  // Test 2: Get companies list
  const companies = await apiCall('/conversations/browse-companies');
  logTest(
    'Browse companies',
    companies.ok,
    companies.ok ? `Found ${companies.data?.data?.companies?.length || 0} companies` : `Error: ${companies.data?.message || companies.error}`
  );

  // Test 3: Get company conversations (if admin/employee)
  if (testConfig.credentials.admin?.activeCompany?.companyId) {
    const companyId = testConfig.credentials.admin.activeCompany.companyId;
    const companyConvos = await apiCall(`/conversations/company/list?companyId=${companyId}`);
    logTest(
      'Get company conversations',
      companyConvos.ok,
      companyConvos.ok ? `Found ${companyConvos.data?.data?.total || 0} conversations` : `Error: ${companyConvos.data?.message || companyConvos.error}`
    );
  } else {
    logTest('Get company conversations', false, 'No admin credentials available', true);
  }
}

async function testCompanyEndpoints() {
  logSection('🏢 COMPANY TESTS');

  if (!TOKEN) {
    logTest('Company tests', false, 'Token required', true);
    return;
  }

  // Test 1: Get company profile (if admin)
  if (testConfig.credentials.admin?.activeCompany?.companyId) {
    const companyId = testConfig.credentials.admin.activeCompany.companyId;
    const profile = await apiCall(`/company/${companyId}/profile`);
    logTest(
      'Get company profile',
      profile.ok,
      profile.ok ? `Company: ${profile.data?.data?.name}` : `Error: ${profile.data?.message || profile.error}`
    );
  } else {
    logTest('Get company profile', false, 'No admin credentials', true);
  }

  // Test 2: Get employees list
  if (testConfig.credentials.admin?.activeCompany?.companyId) {
    const companyId = testConfig.credentials.admin.activeCompany.companyId;
    const employees = await apiCall(`/employees/company/${companyId}`);
    logTest(
      'Get company employees',
      employees.ok,
      employees.ok ? `Found ${employees.data?.data?.employees?.length || 0} employees` : `Error: ${employees.data?.message || employees.error}`
    );
  } else {
    logTest('Get company employees', false, 'No admin credentials', true);
  }
}

async function testDashboardEndpoints() {
  logSection('📊 DASHBOARD TESTS');

  if (!TOKEN) {
    logTest('Dashboard tests', false, 'Token required', true);
    return;
  }

  // Test 1: Get dashboard stats
  if (testConfig.credentials.admin?.activeCompany?.companyId) {
    const companyId = testConfig.credentials.admin.activeCompany.companyId;
    const stats = await apiCall(`/dashboard/stats?companyId=${companyId}`);
    logTest(
      'Get dashboard stats',
      stats.ok,
      stats.ok ? 'Stats retrieved successfully' : `Error: ${stats.data?.message || stats.error}`
    );
  } else {
    logTest('Get dashboard stats', false, 'No admin credentials', true);
  }

  // Test 2: Get recent activities
  if (testConfig.credentials.admin?.activeCompany?.companyId) {
    const companyId = testConfig.credentials.admin.activeCompany.companyId;
    const activities = await apiCall(`/activity-logs/recent?companyId=${companyId}&limit=10`);
    logTest(
      'Get recent activities',
      activities.ok,
      activities.ok ? `Found ${activities.data?.data?.logs?.length || 0} activities` : `Error: ${activities.data?.message || activities.error}`
    );
  } else {
    logTest('Get recent activities', false, 'No admin credentials', true);
  }
}

async function testOrders() {
  logSection('🛒 ORDER TESTS');

  if (!TOKEN) {
    logTest('Order tests', false, 'Token required', true);
    return;
  }

  // Test 1: Get my orders
  const myOrders = await apiCall('/orders/my-orders');
  logTest(
    'Get my orders',
    myOrders.ok,
    myOrders.ok ? `Found ${myOrders.data?.data?.orders?.length || 0} orders` : `Error: ${myOrders.data?.message || myOrders.error}`
  );

  // Test 2: Get company orders
  if (testConfig.credentials.admin?.activeCompany?.companyId) {
    const companyId = testConfig.credentials.admin.activeCompany.companyId;
    const companyOrders = await apiCall(`/orders/company/${companyId}`);
    logTest(
      'Get company orders',
      companyOrders.ok,
      companyOrders.ok ? `Found ${companyOrders.data?.data?.orders?.length || 0} orders` : `Error: ${companyOrders.data?.message || companyOrders.error}`
    );
  } else {
    logTest('Get company orders', false, 'No admin credentials', true);
  }
}

async function testProjects() {
  logSection('📁 PROJECT TESTS');

  if (!TOKEN || !testConfig.credentials.admin?.activeCompany?.companyId) {
    logTest('Project tests', false, 'Token and admin credentials required', true);
    return;
  }

  const companyId = testConfig.credentials.admin.activeCompany.companyId;

  // Test 1: Get projects
  const projects = await apiCall(`/projects?companyId=${companyId}`);
  logTest(
    'Get projects',
    projects.ok,
    projects.ok ? `Found ${projects.data?.data?.projects?.length || 0} projects` : `Error: ${projects.data?.message || projects.error}`
  );
}

async function testTasks() {
  logSection('✅ TASK TESTS');

  if (!TOKEN || !testConfig.credentials.admin?.activeCompany?.companyId) {
    logTest('Task tests', false, 'Token and admin credentials required', true);
    return;
  }

  const companyId = testConfig.credentials.admin.activeCompany.companyId;

  // Test 1: Get tasks
  const tasks = await apiCall(`/tasks?companyId=${companyId}`);
  logTest(
    'Get tasks',
    tasks.ok,
    tasks.ok ? `Found ${tasks.data?.data?.tasks?.length || 0} tasks` : `Error: ${tasks.data?.message || tasks.error}`
  );
}

async function testAI() {
  logSection('🤖 AI TESTS');

  if (!TOKEN) {
    logTest('AI tests', false, 'Token required', true);
    return;
  }

  // Test 1: AI health check
  const aiHealth = await apiCall('/ai/health');
  logTest(
    'AI service health',
    aiHealth.ok,
    aiHealth.ok ? 'AI service is healthy' : `Error: ${aiHealth.data?.message || aiHealth.error}`
  );

  // Test 2: AI insights (if admin)
  if (testConfig.credentials.admin?.activeCompany?.companyId) {
    const companyId = testConfig.credentials.admin.activeCompany.companyId;
    const insights = await apiCall(`/ai/company/insights?companyId=${companyId}`);
    logTest(
      'Get AI insights',
      insights.ok,
      insights.ok ? 'Insights generated' : `Error: ${insights.data?.message || insights.error}`
    );
  } else {
    logTest('Get AI insights', false, 'No admin credentials', true);
  }
}

async function testNotifications() {
  logSection('🔔 NOTIFICATION TESTS');

  if (!TOKEN) {
    logTest('Notification tests', false, 'Token required', true);
    return;
  }

  // Test 1: Get my notifications
  const notifications = await apiCall('/notifications/my-notifications');
  logTest(
    'Get my notifications',
    notifications.ok,
    notifications.ok ? `Found ${notifications.data?.data?.notifications?.length || 0} notifications` : `Error: ${notifications.data?.message || notifications.error}`
  );

  // Test 2: Get unread count
  const unreadCount = await apiCall('/notifications/unread-count');
  logTest(
    'Get unread count',
    unreadCount.ok,
    unreadCount.ok ? `Unread: ${unreadCount.data?.data?.count || 0}` : `Error: ${unreadCount.data?.message || unreadCount.error}`
  );
}

// ============ Main Test Runner ============

async function runAllTests() {
  logSection('🧪 COMPLETE API TEST SUITE');
  
  log(`📁 Base URL: ${BASE_URL}`, 'cyan');
  log(`🔑 Token: ${TOKEN ? 'Available ✅' : 'Missing ❌'}`, TOKEN ? 'green' : 'red');
  
  if (testConfig.credentials.client) {
    log(`👤 Test User: ${testConfig.credentials.client.email}`, 'cyan');
  }
  if (testConfig.credentials.admin) {
    log(`👑 Test Admin: ${testConfig.credentials.admin.email}`, 'cyan');
  }

  // Run all test suites
  await testServerHealth();
  await testAuthentication();
  await testConversations();
  await testCompanyEndpoints();
  await testDashboardEndpoints();
  await testOrders();
  await testProjects();
  await testTasks();
  await testAI();
  await testNotifications();

  // Summary
  logSection('📊 TEST SUMMARY');
  log(`  Total Tests: ${results.passed + results.failed + results.skipped}`);
  log(`  ✅ Passed: ${results.passed}`, 'green');
  log(`  ❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`  ⏭️  Skipped: ${results.skipped}`, 'yellow');
  
  const successRate = results.passed + results.failed > 0 
    ? Math.round((results.passed / (results.passed + results.failed)) * 100)
    : 0;
  log(`  📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');

  // Failed tests detail
  if (results.failed > 0) {
    logSection('❌ FAILED TESTS');
    results.tests
      .filter(t => t.passed === false)
      .forEach(t => {
        log(`  • ${t.name}`, 'red');
        if (t.details) log(`    ${t.details}`, 'yellow');
      });
  }

  // Save results
  const resultsPath = './test-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: results.passed + results.failed + results.skipped,
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      successRate: successRate
    },
    tests: results.tests
  }, null, 2));
  
  log(`\n💾 Results saved to: ${resultsPath}`, 'cyan');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
