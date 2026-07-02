import fs from 'fs';
import path from 'path';

const srcDir = '/tmp/yuihime32';
const destDir = process.cwd();

console.log('Starting sync from', srcDir, 'to', destDir);

// 1. First, backup existing data if they exist
const filesToBackup = [
  '.yuihime/data/yuihime.db',
  '.yuihime/data/yuihime.db-shm',
  '.yuihime/data/yuihime.db-wal',
  '.yuihime/data/config.toml'
];

for (const relPath of filesToBackup) {
  const fullDestPath = path.join(destDir, relPath);
  if (fs.existsSync(fullDestPath)) {
    const backupPath = fullDestPath + '.pre32';
    try {
      fs.copyFileSync(fullDestPath, backupPath);
      console.log(`Backed up ${relPath} to ${backupPath}`);
    } catch (e) {
      console.error(`Failed to backup ${relPath}:`, e);
    }
  }
}

// 2. Recursive function to delete files in dest that are NOT in src, and copy files from src to dest
function syncDirectories(src: string, dest: string) {
  // If dest is node_modules, skip
  if (dest.endsWith('node_modules')) {
    return;
  }

  // Create dest if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Get all children in src
  const srcChildren = fs.readdirSync(src);
  const srcChildrenSet = new Set(srcChildren);

  // Get all children in dest
  const destChildren = fs.readdirSync(dest);

  // Delete files/folders in dest that are NOT in src
  // BUT we preserve .yuihime/data files and .git or node_modules
  for (const child of destChildren) {
    if (child === 'node_modules' || child === '.git') {
      continue;
    }
    // If we are in .yuihime/data, don't delete existing database/config files unless we are replacing them
    if (dest.endsWith('.yuihime/data') && (child.startsWith('yuihime.db') || child === 'config.toml')) {
      continue;
    }
    
    if (!srcChildrenSet.has(child)) {
      const childDestPath = path.join(dest, child);
      try {
        const stats = fs.statSync(childDestPath);
        if (stats.isDirectory()) {
          fs.rmSync(childDestPath, { recursive: true, force: true });
          console.log(`Deleted directory: ${childDestPath}`);
        } else {
          fs.unlinkSync(childDestPath);
          console.log(`Deleted file: ${childDestPath}`);
        }
      } catch (e) {
        console.error(`Failed to delete ${childDestPath}:`, e);
      }
    }
  }

  // Copy from src to dest
  for (const child of srcChildren) {
    const childSrcPath = path.join(src, child);
    const childDestPath = path.join(dest, child);
    const stats = fs.statSync(childSrcPath);

    if (stats.isDirectory()) {
      syncDirectories(childSrcPath, childDestPath);
    } else {
      // Copy file
      try {
        fs.copyFileSync(childSrcPath, childDestPath);
        console.log(`Copied: ${childSrcPath} -> ${childDestPath}`);
      } catch (e) {
        console.error(`Failed to copy ${childSrcPath} to ${childDestPath}:`, e);
      }
    }
  }
}

syncDirectories(srcDir, destDir);
console.log('Sync completed successfully!');
