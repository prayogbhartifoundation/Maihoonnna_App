const SupabaseStorage = require('./supabaseStorage');
const S3Storage = require('./s3Storage');

let storageServiceInstance = null;

function getStorageService() {
  if (storageServiceInstance) return storageServiceInstance;

  const provider = process.env.STORAGE_PROVIDER || 'supabase';

  if (provider === 's3') {
    storageServiceInstance = new S3Storage();
  } else {
    // Default to supabase
    storageServiceInstance = new SupabaseStorage();
  }

  return storageServiceInstance;
}

module.exports = getStorageService();
