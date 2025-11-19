#!/usr/bin/env node

/**
 * Script to remove unwanted apps from the monorepo
 *
 * Usage:
 *   node scripts/remove-app.js mobile
 *   node scripts/remove-app.js extension
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appName = process.argv[2];

const APP_CONFIGS = {
  mobile: {
    dir: 'apps/mobile',
    packageName: '@repo/mobile',
    scripts: ['dev:mobile', 'build:mobile']
  },
  extension: {
    dir: 'apps/extension',
    packageName: '@repo/extension',
    scripts: ['dev:extension', 'build:extension']
  }
};

function removeApp(appName) {
  const config = APP_CONFIGS[appName];

  if (!config) {
    console.error(`❌ Unknown app: ${appName}`);
    console.log(`\nAvailable apps: ${Object.keys(APP_CONFIGS).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🗑️  Removing ${appName} app...\n`);

  // 1. Remove directory
  if (fs.existsSync(config.dir)) {
    console.log(`📁 Removing ${config.dir}...`);
    fs.rmSync(config.dir, { recursive: true, force: true });
    console.log(`   ✅ Removed ${config.dir}`);
  } else {
    console.log(`   ⚠️  Directory ${config.dir} not found, skipping`);
  }

  // 2. Update pnpm-workspace.yaml
  console.log('\n📝 Updating pnpm-workspace.yaml...');
  const workspacePath = 'pnpm-workspace.yaml';
  if (fs.existsSync(workspacePath)) {
    let workspace = fs.readFileSync(workspacePath, 'utf8');
    workspace += `\n  - "!${config.dir}"`;
    fs.writeFileSync(workspacePath, workspace);
    console.log('   ✅ Updated workspace configuration');
  }

  // 3. Update root package.json
  console.log('\n📦 Updating root package.json...');
  const packagePath = 'package.json';
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  config.scripts.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
      delete pkg.scripts[script];
      console.log(`   ✅ Removed script: ${script}`);
    }
  });

  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');

  // 4. Clean up
  console.log('\n🧹 Cleaning up...');
  try {
    execSync('pnpm install', { stdio: 'inherit' });
    console.log('   ✅ Updated lockfile');
  } catch (error) {
    console.log('   ⚠️  Failed to update lockfile, you may need to run `pnpm install` manually');
  }

  // 5. Update documentation
  console.log('\n📚 Documentation updates:');
  console.log(`   ⚠️  Remember to update:`);
  console.log(`      - README.md`);
  console.log(`      - CUSTOMIZATION.md`);
  console.log(`      - Any other docs mentioning ${appName}`);

  console.log(`\n✨ Successfully removed ${appName} app!\n`);
  console.log('Next steps:');
  console.log('  1. Review and commit changes');
  console.log('  2. Update documentation');
  console.log('  3. Test the build: pnpm build\n');
}

if (!appName) {
  console.error('❌ Please specify an app to remove');
  console.log('\nUsage:');
  console.log('  pnpm remove:mobile');
  console.log('  pnpm remove:extension');
  console.log('\nOr directly:');
  console.log('  node scripts/remove-app.js mobile');
  console.log('  node scripts/remove-app.js extension');
  process.exit(1);
}

removeApp(appName);
