const { prisma } = require('../lib/prisma');

/**
 * Get a configuration value from the system_configs table.
 * If the key doesn't exist, it returns the provided defaultValue.
 * The value is automatically parsed to match the type of the defaultValue (number, float, boolean, string).
 * 
 * @param {string} key - Configuration setting key
 * @param {any} defaultValue - Fallback value
 * @returns {Promise<any>}
 */
async function getConfigValue(key, defaultValue) {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key },
    });
    if (!config) {
      return defaultValue;
    }

    const val = config.value;
    if (typeof defaultValue === 'number') {
      if (val.includes('.')) {
        const floatVal = parseFloat(val);
        return isNaN(floatVal) ? defaultValue : floatVal;
      }
      const intVal = parseInt(val, 10);
      return isNaN(intVal) ? defaultValue : intVal;
    }
    if (typeof defaultValue === 'boolean') {
      return val === 'true';
    }
    return val;
  } catch (error) {
    console.error(`[ConfigUtil] Error reading key "${key}":`, error);
    return defaultValue;
  }
}

module.exports = {
  getConfigValue,
};
