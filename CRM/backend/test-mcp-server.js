/**
 * MCP Server Test Suite
 * 
 * Tests for Model Context Protocol (MCP) server functionality
 * including GitKraken integration for git operations.
 * 
 * Run: node test-mcp-server.js
 */

import { execSync, exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const PROJECT_ROOT = path.resolve(process.cwd(), '..');
const BACKEND_DIR = process.cwd();

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? 'green' : 'red';
  log(`  ${status}: ${name}`, color);
  if (details && !passed) {
    log(`    Details: ${details}`, 'yellow');
  }
  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

// ============ Git Operation Tests ============

function testGitStatus() {
  log('\n📋 Testing Git Status...', 'blue');
  try {
    const output = execSync('git status --porcelain', { 
      cwd: PROJECT_ROOT, 
      encoding: 'utf-8' 
    });
    logTest('Git status command executes', true);
    
    // Check if we're in a git repo
    const isGitRepo = fs.existsSync(path.join(PROJECT_ROOT, '.git'));
    logTest('Project is a git repository', isGitRepo);
    
    return true;
  } catch (error) {
    logTest('Git status command executes', false, error.message);
    return false;
  }
}

function testGitBranch() {
  log('\n🌿 Testing Git Branch...', 'blue');
  try {
    const currentBranch = execSync('git branch --show-current', { 
      cwd: PROJECT_ROOT, 
      encoding: 'utf-8' 
    }).trim();
    
    logTest('Can get current branch', true);
    logTest(`Current branch is '${currentBranch}'`, currentBranch === 'main', 
      currentBranch !== 'main' ? `Expected 'main', got '${currentBranch}'` : '');
    
    // List all branches
    const branches = execSync('git branch -a', { 
      cwd: PROJECT_ROOT, 
      encoding: 'utf-8' 
    });
    logTest('Can list all branches', branches.length > 0);
    
    return true;
  } catch (error) {
    logTest('Git branch operations', false, error.message);
    return false;
  }
}

function testGitLog() {
  log('\n📜 Testing Git Log...', 'blue');
  try {
    const log_output = execSync('git log --oneline -5', { 
      cwd: PROJECT_ROOT, 
      encoding: 'utf-8' 
    });
    
    logTest('Can retrieve git log', log_output.length > 0);
    
    const commits = log_output.trim().split('\n');
    logTest(`Has commit history (${commits.length} recent commits)`, commits.length > 0);
    
    return true;
  } catch (error) {
    logTest('Git log operations', false, error.message);
    return false;
  }
}

function testGitRemote() {
  log('\n🌐 Testing Git Remote...', 'blue');
  try {
    const remotes = execSync('git remote -v', { 
      cwd: PROJECT_ROOT, 
      encoding: 'utf-8' 
    });
    
    logTest('Can list git remotes', remotes.length > 0);
    logTest('Has origin remote', remotes.includes('origin'));
    logTest('Remote is GitHub', remotes.includes('github.com'));
    
    return true;
  } catch (error) {
    logTest('Git remote operations', false, error.message);
    return false;
  }
}

function testGitDiff() {
  log('\n📝 Testing Git Diff...', 'blue');
  try {
    // This will be empty if no changes, but command should work
    execSync('git diff --stat', { 
      cwd: PROJECT_ROOT, 
      encoding: 'utf-8' 
    });
    
    logTest('Git diff command executes', true);
    
    // Test diff against remote
    execSync('git diff --stat origin/main', { 
      cwd: PROJECT_ROOT, 
      encoding: 'utf-8' 
    });
    logTest('Can diff against origin/main', true);
    
    return true;
  } catch (error) {
    logTest('Git diff operations', false, error.message);
    return false;
  }
}

// ============ File System Tests ============

function testFileOperations() {
  log('\n📁 Testing File Operations...', 'blue');
  
  // Test reading project structure
  const backendExists = fs.existsSync(path.join(PROJECT_ROOT, 'CRM', 'backend'));
  logTest('Backend directory exists', backendExists);
  
  const frontendExists = fs.existsSync(path.join(PROJECT_ROOT, 'CRM', 'Client-web'));
  logTest('Client-web directory exists', frontendExists);
  
  const serverExists = fs.existsSync(path.join(BACKEND_DIR, 'server.js'));
  logTest('server.js exists', serverExists);
  
  const packageExists = fs.existsSync(path.join(BACKEND_DIR, 'package.json'));
  logTest('package.json exists', packageExists);
  
  const envExists = fs.existsSync(path.join(BACKEND_DIR, '.env'));
  logTest('.env file exists', envExists);
  
  return backendExists && frontendExists && serverExists;
}

function testProjectStructure() {
  log('\n🏗️ Testing Project Structure...', 'blue');
  
  const requiredDirs = [
    'src/controllers',
    'src/models',
    'src/routes',
    'src/services',
    'src/middleware',
    'src/utils',
    'src/config'
  ];
  
  let allExist = true;
  for (const dir of requiredDirs) {
    const exists = fs.existsSync(path.join(BACKEND_DIR, dir));
    logTest(`Directory ${dir} exists`, exists);
    if (!exists) allExist = false;
  }
  
  return allExist;
}

// ============ Environment Tests ============

function testEnvironmentVariables() {
  log('\n🔐 Testing Environment Configuration...', 'blue');
  
  try {
    const envPath = path.join(BACKEND_DIR, '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    const requiredVars = [
      'PORT',
      'MONGO_URI',
      'FIREBASE_PROJECT_ID',
      'GEMINI_API_KEY'
    ];
    
    for (const varName of requiredVars) {
      const exists = envContent.includes(`${varName}=`);
      logTest(`Environment variable ${varName} is configured`, exists);
    }
    
    return true;
  } catch (error) {
    logTest('Can read .env file', false, error.message);
    return false;
  }
}

// ============ API Endpoint Tests ============

async function testServerHealth() {
  log('\n🏥 Testing Server Health...', 'blue');
  
  try {
    const response = await fetch('http://localhost:5000/api/health');
    logTest('Server responds to health check', response.ok);
    return response.ok;
  } catch (error) {
    logTest('Server is running', false, 'Server may not be running on port 5000');
    return false;
  }
}

// ============ Main Test Runner ============

async function runTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('🧪 MCP SERVER TEST SUITE', 'blue');
  log('='.repeat(60), 'blue');
  log(`📁 Project Root: ${PROJECT_ROOT}`);
  log(`📁 Backend Dir: ${BACKEND_DIR}`);
  log('='.repeat(60), 'blue');

  // Run all tests
  testGitStatus();
  testGitBranch();
  testGitLog();
  testGitRemote();
  testGitDiff();
  testFileOperations();
  testProjectStructure();
  testEnvironmentVariables();
  
  // Async tests
  await testServerHealth();

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('📊 TEST SUMMARY', 'blue');
  log('='.repeat(60), 'blue');
  log(`  Total Tests: ${results.passed + results.failed}`);
  log(`  ✅ Passed: ${results.passed}`, 'green');
  log(`  ❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log('='.repeat(60), 'blue');

  // Return exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  process.exit(1);
});
