/**
 * Centralized Dictionary for System-Level Benefit Types & Benefits (Mobile Backend)
 */

export const SYSTEM_BENEFITS = {
  EMERGENCY: {
    TYPE_CODE: 'EMERGENCY',
    TYPE_NAME: 'Emergency',
    BENEFIT_CODE: 'EMR_101',
    BENEFIT_NAME: 'Emergency Button',
    MATCH_PREFIXES: ['EMR_', 'EMERGENCY', 'AMBULANCE']
  },
  SATHI_COMPANION: {
    TYPE_CODE: 'SATHI_COMPANION',
    TYPE_NAME: 'Sathi Companion',
    BENEFIT_CODE: 'SATHI_102',
    BENEFIT_NAME: 'Saathi Visit',
    MATCH_PREFIXES: ['SATHI_', 'SATHI_COMPANION']
  }
};

export function isEmergencyBenefit(benefit: any): boolean {
  if (!benefit) return false;
  const bCode = benefit.code?.toUpperCase() || '';
  const bType = benefit.benefitType;
  const bTypeCode = bType?.code?.toUpperCase() || '';
  const bTypeName = bType?.name?.toLowerCase() || '';

  return (
    SYSTEM_BENEFITS.EMERGENCY.MATCH_PREFIXES.some(prefix => bCode.startsWith(prefix) || bTypeCode === prefix) ||
    bTypeName.includes('emergency') ||
    bTypeName.includes('ambulance')
  );
}

export function isSathiBenefit(benefit: any): boolean {
  if (!benefit) return false;
  const bCode = benefit.code?.toUpperCase() || '';
  const bType = benefit.benefitType;
  const bTypeCode = bType?.code?.toUpperCase() || '';
  const bTypeName = bType?.name?.toLowerCase() || '';

  return (
    SYSTEM_BENEFITS.SATHI_COMPANION.MATCH_PREFIXES.some(prefix => bCode.startsWith(prefix) || bTypeCode === prefix) ||
    bTypeName.includes('sathi')
  );
}
