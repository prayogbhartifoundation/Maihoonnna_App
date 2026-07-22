const { prisma } = require('../lib/prisma');
const { SYSTEM_BENEFITS } = require('./systemBenefits');

/**
 * Ensures that the system BenefitType 'Emergency' and Benefit 'Emergency Button'
 * exist in the database based on the centralized SYSTEM_BENEFITS configuration.
 */
async function ensureEmergencyBenefit() {
  try {
    const config = SYSTEM_BENEFITS.EMERGENCY;

    // 1. Find or create BenefitType "Emergency"
    let bType = await prisma.benefitType.findFirst({
      where: {
        OR: [
          { code: config.TYPE_CODE },
          { name: config.TYPE_NAME }
        ]
      }
    });

    if (!bType) {
      bType = await prisma.benefitType.create({
        data: {
          code: config.TYPE_CODE,
          name: config.TYPE_NAME,
          description: '24/7 Emergency SOS & Response Services',
          iconCode: config.ICON,
          isSystem: true,
          displayOrder: 1,
          isActive: true
        }
      });
      console.log(`✅ System BenefitType created: ${bType.name} (code: ${bType.code})`);
    }

    // 2. Find or create Benefit "Emergency Button" under Emergency BenefitType
    let bBenefit = await prisma.benefit.findFirst({
      where: {
        OR: [
          { code: config.BENEFIT_CODE },
          { name: config.BENEFIT_NAME }
        ]
      }
    });

    if (!bBenefit) {
      bBenefit = await prisma.benefit.create({
        data: {
          benefitTypeId: bType.id,
          code: config.BENEFIT_CODE,
          name: config.BENEFIT_NAME,
          description: config.DESCRIPTION,
          unitLabel: config.UNIT_LABEL,
          defaultUnits: 1,
          isChargeable: false,
          displayOrder: 1,
          isActive: true
        }
      });
      console.log(`✅ System Benefit created: ${bBenefit.name} (code: ${bBenefit.code})`);
    }

    return { bType, bBenefit };
  } catch (err) {
    console.error('[ensureEmergencyBenefit] Error seeding emergency benefit:', err);
  }
}

module.exports = { ensureEmergencyBenefit };
