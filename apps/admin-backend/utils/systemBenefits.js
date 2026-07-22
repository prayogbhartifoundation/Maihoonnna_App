/**
 * Centralized Dictionary for System-Level Benefit Types & Benefits.
 * Eliminates magic strings and hardcoded codes across the codebase.
 */

const SYSTEM_BENEFITS = {
  EMERGENCY: {
    TYPE_CODE: 'EMERGENCY',
    TYPE_NAME: 'Emergency',
    BENEFIT_CODE: 'EMR_101',
    BENEFIT_NAME: 'Emergency Button',
    DESCRIPTION: 'Instant SOS Emergency Alert button with radar response & resolution tracking',
    ICON: '🚨',
    UNIT_LABEL: 'per request',
    MATCH_PREFIXES: ['EMR_', 'EMERGENCY', 'AMBULANCE']
  },
  SATHI_COMPANION: {
    TYPE_CODE: 'SATHI_COMPANION',
    TYPE_NAME: 'Sathi Companion',
    BENEFIT_CODE: 'SATHI_102',
    BENEFIT_NAME: 'Saathi Visit',
    DESCRIPTION: 'Care Companion in-person home visit and companionship',
    ICON: '👥',
    UNIT_LABEL: 'per visit',
    MATCH_PREFIXES: ['SATHI_', 'SATHI_COMPANION']
  }
};

/**
 * Checks if a given benefit matches the Emergency system benefit definition
 */
function isEmergencyBenefit(benefit) {
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

/**
 * Checks if a given benefit matches the Sathi Companion system benefit definition
 */
function isSathiBenefit(benefit) {
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

module.exports = {
  SYSTEM_BENEFITS,
  isEmergencyBenefit,
  isSathiBenefit
};
