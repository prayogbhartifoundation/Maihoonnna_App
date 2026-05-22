const fs = require('fs');
const path = require('path');

/**
 * Copy Schema Script
 * This script copies the shared Prisma schema from the packages/database directory
 * into the local prisma folder. This is useful for deployment on platforms that
 * don't allow relative path access to other monorepo packages.
 */

const sourcePath = path.resolve(
  __dirname,
  '../../../packages/database/prisma/schema.prisma'
);
const destDir = path.resolve(__dirname, '../prisma');
const destPath = path.resolve(destDir, 'schema.prisma');

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy schema
try {
  fs.copyFileSync(sourcePath, destPath);
  console.log(`✅ Prisma schema copied from ${sourcePath} to ${destPath}`);
} catch (error) {
  console.error(`❌ Error copying Prisma schema: ${error.message}`);
  process.exit(1);
}
