/**
 * Backfill script: creates BeneficiaryVitalConfig rows for existing beneficiaries
 * who were enrolled before the relational vitals system was introduced.
 * Since all legacy track* boolean fields have been removed from the schema,
 * this script now assigns ALL active vital definitions to every active beneficiary
 * that does not already have a vitalConfig row.
 *
 * Run with:
 *   npx ts-node --transpile-only prisma/backfill_vital_configs.ts
 */
import prisma from '../app/core/database';

async function main() {
  console.log('🔄 Backfilling BeneficiaryVitalConfig for existing beneficiaries...');

  // Fetch all active vital definitions once (latest versions only)
  const vitalDefs = await prisma.vitalDefinition.findMany({
    where: { isActive: true, isLatestVersion: true }
  });

  if (vitalDefs.length === 0) {
    console.log('⚠️  No active vital definitions found. Create some vitals in the admin panel first.');
    return;
  }

  // Fetch all active beneficiaries
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { isActive: true },
    include: {
      vitalConfigs: { select: { vitalDefinitionId: true } },
    },
  });

  let created = 0;
  let skipped = 0;

  for (const b of beneficiaries) {
    const existingDefIds = new Set(b.vitalConfigs.map((c: any) => c.vitalDefinitionId));

    for (const def of vitalDefs) {
      if (existingDefIds.has(def.id)) {
        skipped++;
        continue;
      }

      await prisma.beneficiaryVitalConfig.upsert({
        where: {
          beneficiaryId_vitalDefinitionId: {
            beneficiaryId: b.id,
            vitalDefinitionId: def.id,
          },
        },
        update: { isActive: true },
        create: {
          beneficiaryId: b.id,
          vitalDefinitionId: def.id,
          isActive: true,
          frequency: 'every_visit',
        },
      });
      created++;
      console.log(`  ✅  ${b.name} → ${def.code}`);
    }
  }

  console.log(`\n✨ Done. Created: ${created}, Already existed: ${skipped}`);
}

main()
  .catch(e => { console.error('❌ Backfill failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
