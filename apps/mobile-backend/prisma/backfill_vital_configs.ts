/**
 * Backfill script: creates BeneficiaryVitalConfig rows for legacy beneficiaries
 * who were enrolled before the relational vitals system was wired up during checkout.
 *
 * Run with:
 *   npx ts-node --transpile-only prisma/backfill_vital_configs.ts
 */
import prisma from '../app/core/database';

async function main() {
  console.log('🔄 Backfilling BeneficiaryVitalConfig for legacy beneficiaries...');

  // Map legacy boolean flag → VitalDefinition code
  const FLAG_TO_CODE: Record<string, string> = {
    trackBloodPressure:    'BP',
    trackHeartRate:        'PULSE',
    trackBloodSugar:       'BLOOD_GLUCOSE',
    trackTemperature:      'TEMP',
    trackOxygenSaturation: 'SPO2',
    trackWeight:           'WEIGHT',
    trackPainLevel:        'PAIN',
    trackRespiratoryRate:  'RESP',
  };

  // Fetch all active vital definitions once
  const vitalDefs = await prisma.vitalDefinition.findMany({ where: { isActive: true } });
  const codeToId: Record<string, string> = {};
  for (const def of vitalDefs) {
    codeToId[def.code] = def.id;
  }

  // Fetch all beneficiaries with at least one track flag = true
  const beneficiaries = await prisma.beneficiary.findMany({
    where: {
      isActive: true,
      OR: [
        { trackBloodPressure: true },
        { trackHeartRate: true },
        { trackBloodSugar: true },
        { trackTemperature: true },
        { trackOxygenSaturation: true },
        { trackWeight: true },
        { trackPainLevel: true },
        { trackRespiratoryRate: true },
      ],
    },
    include: {
      vitalConfigs: { select: { vitalDefinitionId: true } },
    },
  });

  const today = new Date(new Date().setHours(0, 0, 0, 0));
  let created = 0;
  let skipped = 0;

  for (const b of beneficiaries) {
    const existingDefIds = new Set(b.vitalConfigs.map((c: any) => c.vitalDefinitionId));

    for (const [flag, code] of Object.entries(FLAG_TO_CODE)) {
      const isTracked = (b as any)[flag] === true;
      if (!isTracked) continue;

      const defId = codeToId[code];
      if (!defId) {
        console.warn(`  ⚠️  No VitalDefinition found for code "${code}" — skipping`);
        continue;
      }

      if (existingDefIds.has(defId)) {
        skipped++;
        continue; // already has a relational config
      }

      await prisma.beneficiaryVitalConfig.upsert({
        where: {
          beneficiaryId_vitalDefinitionId_effectiveFrom: {
            beneficiaryId: b.id,
            vitalDefinitionId: defId,
            effectiveFrom: today,
          },
        },
        update: { isActive: true },
        create: {
          beneficiaryId: b.id,
          vitalDefinitionId: defId,
          isActive: true,
          frequency: 'every_visit',
          effectiveFrom: today,
        },
      });
      created++;
      console.log(`  ✅  ${b.name} → ${code}`);
    }
  }

  console.log(`\n✨ Done. Created: ${created}, Already existed: ${skipped}`);
}

main()
  .catch(e => { console.error('❌ Backfill failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
