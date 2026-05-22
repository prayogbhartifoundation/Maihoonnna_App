const { v4: uuidv4 } = require('uuid');

/**
 * Sanitizes a file name by removing spaces and special characters.
 * @param {string} fileName
 * @returns {string}
 */
function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_').toLowerCase();
}

/**
 * Generates a unique file path based on the strategy:
 * staff/{staffProfileId}/{documentType}/{timestamp}_{randomString}_{originalFileName}
 *
 * @param {string} staffProfileId
 * @param {string} documentType
 * @param {string} originalFileName
 * @returns {string} The unique file path
 */
function generateDocumentPath(staffProfileId, documentType, originalFileName) {
  const timestamp = Date.now();
  // Using a short 6-character random string from uuid
  const randomString = uuidv4().split('-')[0];
  const sanitizedName = sanitizeFileName(originalFileName);

  return `staff/${staffProfileId}/${documentType}/${timestamp}_${randomString}_${sanitizedName}`;
}

/**
 * Generates a unique file path for profile photos:
 * profiles/{userId}/{type}/{timestamp}_{randomString}_{originalFileName}
 */
function generateProfilePath(userId, type, originalFileName) {
  const timestamp = Date.now();
  const randomString = uuidv4().split('-')[0];
  const sanitizedName = sanitizeFileName(originalFileName);

  return `profiles/${userId}/${type}/${timestamp}_${randomString}_${sanitizedName}`;
}

module.exports = {
  sanitizeFileName,
  generateDocumentPath,
  generateProfilePath,
};
