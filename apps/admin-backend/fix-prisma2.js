const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesDir).filter((f) => f.endsWith('.js'));

const oldPrismaReq =
  "const { PrismaClient } = require(path.join(__dirname, '../../../backend/node_modules/@prisma/client'));";
const oldPrismaNew = 'const prisma = new PrismaClient();';
const newPrismaImp = "const { prisma } = require('../lib/prisma');";

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace exact occurrences
  content = content.replace(oldPrismaReq, '');
  content = content.replace(oldPrismaNew, newPrismaImp);

  // Clean double newlines maybe
  content = content.replace(/\n\n\n/g, '\n\n');

  fs.writeFileSync(filePath, content);
}
console.log('Routes prisma import updated.');
