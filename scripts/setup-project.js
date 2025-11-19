#!/usr/bin/env node

/**
 * Interactive setup script for fullstack-monorepo-starter
 *
 * This script helps you:
 * - Rename the project
 * - Update package scopes
 * - Configure environment variables
 * - Initialize git repository
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function replaceInFile(filePath, searchValue, replaceValue) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const updated = content.replace(new RegExp(searchValue, 'g'), replaceValue);
  fs.writeFileSync(filePath, updated, 'utf8');
}

function findAndReplace(dir, searchValue, replaceValue, extensions = ['.json', '.ts', '.tsx', '.md']) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !['node_modules', '.git', '.next', 'dist', 'build'].includes(file)) {
      findAndReplace(filePath, searchValue, replaceValue, extensions);
    } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
      replaceInFile(filePath, searchValue, replaceValue);
    }
  }
}

async function main() {
  console.log('\n🚀 Welcome to fullstack-monorepo-starter setup!\n');
  console.log('This wizard will help you customize the template for your project.\n');

  // Step 1: Project Name
  const projectName = await question('Project name (lowercase-with-dashes): ');
  if (!projectName) {
    console.log('❌ Project name is required');
    process.exit(1);
  }

  // Step 2: Organization/Scope
  const useScope = await question('Do you want to use a package scope? (y/n): ');
  let packageScope = '@repo';

  if (useScope.toLowerCase() === 'y') {
    packageScope = await question('Package scope (e.g., @myorg): ');
    if (!packageScope.startsWith('@')) {
      packageScope = `@${packageScope}`;
    }
  }

  // Step 3: Description
  const description = await question('Project description: ');

  // Step 4: Author
  const author = await question('Author name: ');

  // Step 5: Git repository
  const gitRepo = await question('Git repository URL (optional): ');

  console.log('\n📝 Configuration Summary:');
  console.log(`   Project: ${projectName}`);
  console.log(`   Scope: ${packageScope}`);
  console.log(`   Description: ${description || '(none)'}`);
  console.log(`   Author: ${author || '(none)'}`);
  console.log(`   Repository: ${gitRepo || '(none)'}`);

  const confirm = await question('\nProceed with setup? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Setup cancelled');
    process.exit(0);
  }

  console.log('\n⚙️  Setting up your project...\n');

  try {
    // Update root package.json
    console.log('📦 Updating root package.json...');
    const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    rootPkg.name = projectName;
    if (description) rootPkg.description = description;
    if (author) rootPkg.author = author;
    if (gitRepo) {
      rootPkg.repository = {
        type: 'git',
        url: gitRepo
      };
    }
    fs.writeFileSync('package.json', JSON.stringify(rootPkg, null, 2) + '\n');

    // Update package scopes if changed
    if (packageScope !== '@repo') {
      console.log(`📦 Updating package scopes to ${packageScope}...`);

      const packages = [
        'apps/web/package.json',
        'apps/mobile/package.json',
        'apps/extension/package.json',
        'packages/api/package.json',
        'packages/database/package.json'
      ];

      for (const pkgPath of packages) {
        if (fs.existsSync(pkgPath)) {
          replaceInFile(pkgPath, '@repo', packageScope);
        }
      }

      // Update imports
      console.log('📦 Updating import statements...');
      findAndReplace('.', '@repo', packageScope, ['.ts', '.tsx']);
    }

    // Update README
    console.log('📝 Updating README...');
    replaceInFile('README.md', 'fullstack-monorepo-starter', projectName);
    replaceInFile('README.md', 'pycatcedar/fullstack-monorepo-starter', gitRepo.replace('https://github.com/', ''));
    if (author) {
      replaceInFile('README.md', 'Your Name', author);
    }

    // Copy environment files
    console.log('📄 Creating environment files...');
    if (!fs.existsSync('.env')) {
      fs.copyFileSync('.env.example', '.env');
      console.log('   ✅ Created .env');
    }

    if (!fs.existsSync('apps/web/.env.local')) {
      fs.copyFileSync('apps/web/.env.local.example', 'apps/web/.env.local');
      console.log('   ✅ Created apps/web/.env.local');
    }

    if (!fs.existsSync('apps/mobile/.env')) {
      fs.copyFileSync('apps/mobile/.env.example', 'apps/mobile/.env');
      console.log('   ✅ Created apps/mobile/.env');
    }

    if (!fs.existsSync('apps/extension/.env')) {
      fs.copyFileSync('apps/extension/.env.example', 'apps/extension/.env');
      console.log('   ✅ Created apps/extension/.env');
    }

    // Reinitialize git if requested
    const initGit = await question('\nReinitialize git repository? (y/n): ');
    if (initGit.toLowerCase() === 'y') {
      console.log('🔄 Reinitializing git...');
      if (fs.existsSync('.git')) {
        fs.rmSync('.git', { recursive: true, force: true });
      }
      execSync('git init', { stdio: 'inherit' });
      execSync('git add -A', { stdio: 'inherit' });
      execSync('git commit -m "chore: initial commit from template"', { stdio: 'inherit' });
      console.log('   ✅ Git initialized');
    }

    console.log('\n✨ Setup complete!\n');
    console.log('Next steps:');
    console.log('  1. Review and update environment variables in .env files');
    console.log('  2. Start local Supabase: pnpm supabase:start');
    console.log('  3. Start development: pnpm dev');
    console.log('  4. Read the docs: README.md and CUSTOMIZATION.md\n');
    console.log('Happy coding! 🎉\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
