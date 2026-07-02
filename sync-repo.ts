import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const defaultRepoUrl = 'https://github.com/harukilab/yuihime32.git';
const repoUrl = process.argv[2] || defaultRepoUrl;
const tmpDir = path.join('/tmp', `yuihime_sync_${Date.now()}`);
const destDir = process.cwd();

console.log('=============================================');
console.log('🔄 YUIHIME WORKSPACE REPO SYNCHRONIZER');
console.log('=============================================');
console.log(`Repository URL: ${repoUrl}`);
console.log(`Temporary Clone Dir: ${tmpDir}`);
console.log(`Destination Workspace: ${destDir}`);
console.log('---------------------------------------------');

// 1. Pre-sync Backup of Critical Data
const filesToBackup = [
  '.yuihime/data/yuihime.db',
  '.yuihime/data/yuihime.db-shm',
  '.yuihime/data/yuihime.db-wal',
  '.yuihime/data/config.toml',
  '.env'
];

console.log('📦 Securing local database, configurations, and keys...');
for (const relPath of filesToBackup) {
  const fullDestPath = path.join(destDir, relPath);
  if (fs.existsSync(fullDestPath)) {
    const backupPath = fullDestPath + '.bak';
    try {
      fs.copyFileSync(fullDestPath, backupPath);
      console.log(`✅ Backed up ${relPath} to ${backupPath}`);
    } catch (e) {
      console.error(`⚠️ Failed to backup ${relPath}:`, e);
    }
  }
}

// 2. Clone the Repository
try {
  console.log(`\n📥 Cloning repository from ${repoUrl}...`);
  execSync(`git clone ${repoUrl} ${tmpDir}`, { stdio: 'inherit' });
  console.log('✅ Repository cloned successfully.');
} catch (error) {
  console.error('❌ Failed to clone repository. Aborting synchronization.', error);
  process.exit(1);
}

// 3. Recursive Sync function
function syncDirectories(src: string, dest: string) {
  // If destination is node_modules or .git, completely skip
  if (dest.endsWith('node_modules') || dest.endsWith('.git')) {
    return;
  }

  // Create dest if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read files/folders
  const srcChildren = fs.readdirSync(src);
  const srcChildrenSet = new Set(srcChildren);
  const destChildren = fs.readdirSync(dest);

  // A. Purge files in destination that no longer exist in repository source,
  // while carefully safeguarding local state and core system folders.
  for (const child of destChildren) {
    if (child === 'node_modules' || child === '.git' || child === '.yuihime_cache') {
      continue;
    }
    
    // Protect local database, backup files, custom .env, and local key files from deletion
    if (dest.endsWith('.yuihime/data') && (child.startsWith('yuihime.db') || child === 'config.toml' || child.endsWith('.bak'))) {
      continue;
    }
    if (child === '.env' || child.endsWith('.bak')) {
      continue;
    }

    if (!srcChildrenSet.has(child)) {
      const childDestPath = path.join(dest, child);
      try {
        const stats = fs.statSync(childDestPath);
        if (stats.isDirectory()) {
          fs.rmSync(childDestPath, { recursive: true, force: true });
          console.log(`🗑️ Removed extra directory: ${child}`);
        } else {
          fs.unlinkSync(childDestPath);
          console.log(`🗑️ Removed extra file: ${child}`);
        }
      } catch (e) {
        console.error(`⚠️ Failed to remove ${childDestPath}:`, e);
      }
    }
  }

  // B. Copy updated files from source to destination
  for (const child of srcChildren) {
    const childSrcPath = path.join(src, child);
    const childDestPath = path.join(dest, child);
    const stats = fs.statSync(childSrcPath);

    if (stats.isDirectory()) {
      syncDirectories(childSrcPath, childDestPath);
    } else {
      // Avoid overwriting local config.toml or .env if present in dest
      if (dest.endsWith('.yuihime/data') && child === 'config.toml' && fs.existsSync(childDestPath)) {
        console.log(`🛡️ Preserved existing config: ${childDestPath}`);
        continue;
      }
      if (child === '.env' && fs.existsSync(childDestPath)) {
        console.log(`🛡️ Preserved existing .env: ${childDestPath}`);
        continue;
      }

      try {
        fs.copyFileSync(childSrcPath, childDestPath);
        console.log(`🚀 Copied: ${child}`);
      } catch (e) {
        console.error(`⚠️ Failed to copy ${childSrcPath} to ${childDestPath}:`, e);
      }
    }
  }
}

// 4. Perform Synchronization
try {
  console.log('\n🔄 Synchronizing files into workspace...');
  syncDirectories(tmpDir, destDir);
  console.log('✅ Synchronization completed successfully.');
} catch (error) {
  console.error('❌ Error during synchronization:', error);
} finally {
  // 5. Clean up temporary cloned repository directory
  try {
    console.log('\n🧹 Cleaning up temporary clone directory...');
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    console.log('✅ Clean up completed.');
  } catch (cleanupError) {
    console.error('⚠️ Failed to clean up temporary directory:', cleanupError);
  }
}

console.log('\n=============================================');
console.log('🎉 WORKSPACE UPDATE COMPLETION SUMMARY');
console.log('=============================================');
console.log('Please verify the build and lint the applet to ensure everything works.');
