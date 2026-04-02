const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const StorageService = require('./storageInterface');

class S3Storage extends StorageService {
  constructor() {
    super();
    this.bucketName = process.env.STORAGE_BUCKET || 'staff-documents';
    
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !accessKeyId || !secretAccessKey) {
      console.warn('AWS credentials are not fully configured. S3Storage might fail.');
    }

    this.s3Client = new S3Client({
      region: region || 'us-east-1',
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || ''
      }
    });
  }

  async upload(fileBuffer, path, mimeType) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: path,
      Body: fileBuffer,
      ContentType: mimeType,
      // ACL: 'public-read' // Uncomment if you want public access out of the box in S3
    });

    try {
      await this.s3Client.send(command);
      const url = await this.getPublicUrl(path);

      return {
        path: path,
        url: url
      };
    } catch (error) {
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  async delete(path) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: path,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  async getPublicUrl(path) {
    // For public buckets, the URL format is generally standard:
    // This assumes the bucket is public. 
    // For private buckets, we would use @aws-sdk/s3-request-presigner
    const region = await this.s3Client.config.region();
    return `https://${this.bucketName}.s3.${region}.amazonaws.com/${path}`;
  }
}

module.exports = S3Storage;
