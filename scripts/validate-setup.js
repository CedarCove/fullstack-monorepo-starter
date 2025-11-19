#!/usr/bin/env node

/**
 * Validation script to check if the monorepo is set up correctly
 *
 * Usage: pnpm validate
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let errors = [];
let warnings = [];
let passed = 0;

function check(name, condition, errorMsg, isWarning = false) {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    if (isWarning) {
      console.log(`⚠️  ${name}`);
      warnings.push(errorMsg);
    } else {
      console.log(`❌ ${name}`);
      errors.push(errorMsg);
    }
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function hasContent(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf8').trim();
  return content.length > 0;
}

function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

console.log('\n🔍 Validating monorepo setup...\n');
console.log('📋 Core Files\n');

// Core files
check('package.json exists', fileExists('package.json'), 'Missing package.json');
check('pnpm-workspace.yaml exists', fileExists('pnpm-workspace.yaml'), 'Missing pnpm-workspace.yaml');
check('turbo.json exists', fileExists('turbo.json'), 'Missing turbo.json');
check('tsconfig.json exists', fileExists('tsconfig.json'), 'Missing tsconfig.json');

console.log('\n📦 Package Structure\n');

// Apps
check('apps/web exists', fs.existsSync('apps/web'), 'Missing apps/web');
check('apps/mobile exists', fs.existsSync('apps/mobile'), 'Missing apps/mobile', true);
check('apps/extension exists', fs.existsSync('apps/extension'), 'Missing apps/extension', true);

// Packages
check('packages/api exists', fs.existsSync('packages/api'), 'Missing packages/api');
check('packages/database exists', fs.existsSync('packages/database'), 'Missing packages/database');

console.log('\n⚙️  Configuration Files\n');

// Config files
check('.env.example exists', fileExists('.env.example'), 'Missing .env.example');
check('.gitignore exists', fileExists('.gitignore'), 'Missing .gitignore');
check('eslint.config.js exists', fileExists('eslint.config.js'), 'Missing eslint.config.js');
check('.prettierrc exists', fileExists('.prettierrc') || fileExists('.prettierrc.js'), 'Missing prettier config');

console.log('\n🔐 Environment Variables\n');

// Environment files
check('.env exists', fileExists('.env'), 'Missing .env file (copy from .env.example)', true);
check('apps/web/.env.local exists', fileExists('apps/web/.env.local'), 'Missing apps/web/.env.local', true);

// Check for placeholder values
if (fileExists('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  check('.env has Supabase URL', envContent.includes('NEXT_PUBLIC_SUPABASE_URL'), 'Missing SUPABASE_URL in .env', true);
}

console.log('\n🛠️  Tools\n');

// Required tools
check('pnpm installed', commandExists('pnpm'), 'pnpm is not installed (https://pnpm.io)');
check('node installed', commandExists('node'), 'Node.js is not installed');
check('git installed', commandExists('git'), 'Git is not installed');

// Optional tools
check('supabase CLI installed', commandExists('supabase'), 'Supabase CLI not installed (optional)', true);

console.log('\n📚 Documentation\n');

check('README.md exists', fileExists('README.md') && hasContent('README.md'), 'Missing or empty README.md');
check('CUSTOMIZATION.md exists', fileExists('CUSTOMIZATION.md'), 'Missing CUSTOMIZATION.md', true);
check('LICENSE exists', fileExists('LICENSE'), 'Missing LICENSE', true);

console.log('\n🧪 Testing Setup\n');

check('vitest.workspace.ts exists', fileExists('vitest.workspace.ts'), 'Missing vitest.workspace.ts', true);
check('playwright.config.ts exists', fileExists('playwright.config.ts'), 'Missing playwright.config.ts', true);

console.log('\n📊 Results\n');

console.log(`   ✅ Passed: ${passed}`);
console.log(`   ⚠️  Warnings: ${warnings.length}`);
console.log(`   ❌ Errors: ${errors.length}`);

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:\n');
  warnings.forEach((warning, i) => {
    console.log(`   ${i + 1}. ${warning}`);
  });
}

if (errors.length > 0) {
  console.log('\n❌ Errors:\n');
  errors.forEach((error, i) => {
    console.log(`   ${i + 1}. ${error}`);
  });
  console.log('\n');
  process.exit(1);
} else {
  console.log('\n✨ Setup looks good!\n');

  if (warnings.length > 0) {
    console.log('💡 Tips:');
    if (warnings.some(w => w.includes('.env'))) {
      console.log('   - Copy .env.example to .env and configure your environment');
    }
    if (warnings.some(w => w.includes('mobile') || w.includes('extension'))) {
      console.log('   - Remove unused apps with: pnpm remove:mobile or pnpm remove:extension');
    }
    console.log('');
  }

  console.log('Next steps:');
  console.log('  1. Configure environment variables (.env files)');
  console.log('  2. Start Supabase: pnpm supabase:start');
  console.log('  3. Start development: pnpm dev');
  console.log('');
}
