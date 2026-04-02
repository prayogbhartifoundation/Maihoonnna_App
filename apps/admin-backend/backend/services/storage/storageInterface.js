/**
 * StorageService Interface (Implicit in JS)
 * Defines the contract that all storage providers must implement.
 */
class StorageService {
  /**
   * Uploads a file buffer to the storage path.
   * @param {Buffer} fileBuffer - The memory buffer of the file.
   * @param {string} path - The destination path/key.
   * @param {string} mimeType - The MIME type of the file.
   * @returns {Promise<{ path: string, url: string }>} Result object containing path and public URL.
   */
  async upload(fileBuffer, path, mimeType) {
    throw new Error('upload() must be implemented');
  }

  /**
   * Deletes a file by its path/key.
   * @param {string} path - The path/key of the file to delete.
   * @returns {Promise<void>}
   */
  async delete(path) {
    throw new Error('delete() must be implemented');
  }

  /**
   * Gets the public or signed URL for a file.
   * @param {string} path - The path/key to the file.
   * @returns {Promise<string>} The public URL.
   */
  async getPublicUrl(path) {
    throw new Error('getPublicUrl() must be implemented');
  }
}

module.exports = StorageService;
