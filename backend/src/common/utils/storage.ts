import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { config } from '../../config';
import { logger } from '../logger';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';

// Initialize S3 client
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
  // Enable this in development to use localstack
  ...(process.env.NODE_ENV === 'development' && {
    endpoint: config.aws.endpoint,
    forcePathStyle: true,
  }),
});

/**
 * Upload a file to S3
 * @param file File data or stream to upload
 * @param key The S3 object key
 * @param contentType The MIME type of the file
 * @param metadata Optional metadata to store with the file
 * @returns The S3 object key and URL
 */
export const uploadToS3 = async (
  file: Buffer | Readable | string,
  key: string,
  contentType?: string,
  metadata: Record<string, string> = {}
): Promise<{ key: string; url: string }> => {
  try {
    // If file is a path, read it as a stream
    let fileStream: Readable | Buffer;
    if (typeof file === 'string') {
      if (!fs.existsSync(file)) {
        throw new Error(`File not found: ${file}`);
      }
      fileStream = fs.createReadStream(file);
      // Set content type based on file extension if not provided
      if (!contentType) {
        contentType = mime.lookup(file) || 'application/octet-stream';
      }
    } else {
      fileStream = file;
    }

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: config.aws.s3.bucketName,
        Key: key,
        Body: fileStream,
        ContentType: contentType,
        Metadata: metadata,
      },
    });

    await upload.done();
    
    // Generate a public URL for the uploaded file
    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: config.aws.s3.bucketName,
        Key: key,
      }),
      { expiresIn: 3600 } // URL expires in 1 hour
    );

    return { key, url };
  } catch (error) {
    logger.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to storage');
  }
};

/**
 * Generate a pre-signed URL for uploading a file directly from the client
 * @param key The S3 object key
 * @param contentType The MIME type of the file
 * @param expiresIn URL expiration time in seconds (default: 3600)
 * @returns The pre-signed URL and object key
 */
export const getUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; key: string; url: string }> => {
  try {
    const command = new PutObjectCommand({
      Bucket: config.aws.s3.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    const url = `https://${config.aws.s3.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;

    return { uploadUrl, key, url };
  } catch (error) {
    logger.error('Error generating upload URL:', error);
    throw new Error('Failed to generate upload URL');
  }
};

/**
 * Generate a pre-signed URL for downloading a file
 * @param key The S3 object key
 * @param expiresIn URL expiration time in seconds (default: 3600)
 * @returns The pre-signed URL
 */
export const getDownloadUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: config.aws.s3.bucketName,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    logger.error('Error generating download URL:', error);
    throw new Error('Failed to generate download URL');
  }
};

/**
 * Delete a file from S3
 * @param key The S3 object key
 */
export const deleteFromS3 = async (key: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: config.aws.s3.bucketName,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    logger.error('Error deleting from S3:', error);
    throw new Error('Failed to delete file from storage');
  }
};

/**
 * Check if a file exists in S3
 * @param key The S3 object key
 * @returns True if the file exists, false otherwise
 */
export const fileExistsInS3 = async (key: string): Promise<boolean> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: config.aws.s3.bucketName,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false;
    }
    logger.error('Error checking file existence in S3:', error);
    throw error;
  }
};

/**
 * Upload a file to the local filesystem (for development)
 * @param file File data or stream to upload
 * @param key The file path
 * @returns The file path and URL
 */
export const uploadToLocal = async (
  file: Buffer | Readable | string,
  key: string
): Promise<{ key: string; url: string }> => {
  const uploadDir = path.join(process.cwd(), 'uploads');
  const filePath = path.join(uploadDir, key);
  const dirPath = path.dirname(filePath);

  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Handle different file input types
    if (typeof file === 'string') {
      // If it's a path, copy the file
      const fileData = fs.readFileSync(file);
      fs.writeFileSync(filePath, fileData);
    } else if (Buffer.isBuffer(file)) {
      // If it's a buffer, write it directly
      fs.writeFileSync(filePath, file);
    } else if (file instanceof Readable) {
      // If it's a stream, pipe it to a file
      const writeStream = fs.createWriteStream(filePath);
      await new Promise((resolve, reject) => {
        file.pipe(writeStream)
          .on('error', reject)
          .on('finish', resolve);
      });
    } else {
      throw new Error('Invalid file type');
    }

    const url = `/uploads/${key}`;
    return { key, url };
  } catch (error) {
    logger.error('Error uploading file locally:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Delete a file from the local filesystem (for development)
 * @param key The file path
 */
export const deleteFromLocal = async (key: string): Promise<void> => {
  const filePath = path.join(process.cwd(), 'uploads', key);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      
      // Remove empty directories
      const dirPath = path.dirname(filePath);
      const files = fs.readdirSync(dirPath);
      if (files.length === 0) {
        fs.rmdirSync(dirPath);
      }
    }
  } catch (error) {
    logger.error('Error deleting local file:', error);
    throw new Error('Failed to delete file');
  }
};

// Use the appropriate storage based on environment
const storage = {
  upload: process.env.NODE_ENV === 'production' ? uploadToS3 : uploadToLocal,
  delete: process.env.NODE_ENV === 'production' ? deleteFromS3 : deleteFromLocal,
  getUploadUrl: process.env.NODE_ENV === 'production' ? getUploadUrl : null,
  getDownloadUrl: process.env.NODE_ENV === 'production' ? getDownloadUrl : null,
};

export default storage;
