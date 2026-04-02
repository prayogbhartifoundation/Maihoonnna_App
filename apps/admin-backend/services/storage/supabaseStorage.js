const { createClient } = require('@supabase/supabase-js');
const StorageService = require('./storageInterface');

class SupabaseStorage extends StorageService {
  constructor() {
    super();
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    this.bucketName = process.env.STORAGE_BUCKET || 'staff-documents';

    const isPlaceholder = !supabaseKey || supabaseKey === 'your-service-role-key-here';

    if (!supabaseUrl || isPlaceholder) {
      const missing = [];
      if (!supabaseUrl) missing.push('SUPABASE_URL');
      if (isPlaceholder) missing.push('SUPABASE_SERVICE_ROLE_KEY');
      console.error(`[SupabaseStorage] Missing env vars: ${missing.join(', ')}. Set them in Admin_panel/backend/.env`);
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('[SupabaseStorage] Initialized with bucket:', this.bucketName);
    }
  }

  async upload(fileBuffer, path, mimeType) {
    if (!this.supabase) throw new Error('Supabase client is not initialized');

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(path, fileBuffer, {
        contentType: mimeType,
        upsert: false // we generate unique paths, no need to upsert
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const url = await this.getPublicUrl(path);

    return {
      path: data.path,
      url: url
    };
  }

  async delete(path) {
    if (!this.supabase) throw new Error('Supabase client is not initialized');

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  async getPublicUrl(path) {
    if (!this.supabase) throw new Error('Supabase client is not initialized');

    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);

    // If using private buckets, you would use createSignedUrl here instead
    return data.publicUrl;
  }
}

module.exports = SupabaseStorage;
