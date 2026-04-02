const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex replacement for PrismaClient initialization
  content = content.replace(/const { PrismaClient } = require\(path\.join\(__dirname, '\.\.\/\.\.\/\.\.\/backend\/node_modules\/@prisma\/client'\)\);\n?/g, '');
  content = content.replace(/const prisma = new PrismaClient\(\);\n?/g, "const { prisma } = require('../lib/prisma');\n");
  
  // also check other variations just in case
  content = content.replace(/const { PrismaClient } = require\(['"]@prisma\/client['"]\);\n?/g, '');

  fs.writeFileSync(filePath, content);
}

// 3. Fix parallel load in beneficiaries.js
const beneficiariesFile = path.join(routesDir, 'beneficiaries.js');
if (fs.existsSync(beneficiariesFile)) {
  let bContent = fs.readFileSync(beneficiariesFile, 'utf8');
  // Replacing Promise.all for findMany and count
  const oldCode = `const [beneficiaries, total] = await Promise.all([
      prisma.beneficiary.findMany({
        where: whereClause,
        include: {
          primaryCC: { select: { id: true, name: true, photo: true } },
          fieldManager: { select: { id: true, name: true } },
          subscriber: { select: { id: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.beneficiary.count({ where: whereClause })
    ]);`;
  // Just generalizing the regex for Promise.all related to beneficiaries
  let newBContent = bContent.replace(
      /const \[([a-zA-Z0-9]+),\s*([a-zA-Z0-9]+)\]\s*=\s*await Promise\.all\(\[\s*prisma\.([a-zA-Z0-9]+)\.findMany\((.*?)\),\s*prisma\.\3\.count\((.*?)\)\s*\]\);/gs, 
      (match, var1, var2, model, findArgs, countArgs) => {
        return `const ${var1} = await prisma.${model}.findMany(${findArgs});
    const ${var2} = await prisma.${model}.count(${countArgs});`;
      }
  );

  fs.writeFileSync(beneficiariesFile, newBContent);
}

// 4. Add graceful shutdown to server.js
const serverFile = path.join(__dirname, 'server.js');
if (fs.existsSync(serverFile)) {
  let sContent = fs.readFileSync(serverFile, 'utf8');
  
  if (!sContent.includes('process.on(\'SIGINT\'')) {
    sContent += `\n
// Graceful shutdown
const { prisma } = require('./lib/prisma');

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing database connection');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing database connection');
  await prisma.$disconnect();
  process.exit(0);
});
`;
    fs.writeFileSync(serverFile, sContent);
  }
}

console.log('Script completed.');
