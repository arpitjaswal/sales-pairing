import { Request } from 'express';
import multer, { FileFilterCallback, MulterError } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { config } from '../../config';
import { logger } from '../logger';
import { BadRequestException } from '../exceptions';
import AWS from 'aws-sdk';

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

/**
 * Supported file types for upload
 */
const ALLOWED_FILE_TYPES = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

/**
 * Maximum file size (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * File storage configuration
 */
const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: DestinationCallback
  ): void => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: FileNameCallback
  ): void => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

/**
 * File filter to allow only specific file types
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const isValidMimeType = !!ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES];
  const isValidExt = ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'].includes(
    path.extname(file.originalname).toLowerCase()
  );

  if (isValidMimeType && isValidExt) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, JPG, PNG, GIF, WEBP), PDF, and DOC/DOCX files are allowed.'));
  }
};

/**
 * Configured multer middleware for file uploads
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * Middleware for handling single file uploads
 * @param fieldName The name of the file input field
 */
export const uploadSingleFile = (fieldName: string) => {
  return (req: Request, res: any, next: any) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err) {
        if (err instanceof MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new BadRequestException('File size is too large. Maximum size is 10MB.'));
          }
          if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_FIELD_KEY') {
            return next(new BadRequestException('Too many files uploaded.'));
          }
        }
        return next(new BadRequestException(err.message || 'Error uploading file.'));
      }
      next();
    });
  };
};

/**
 * Middleware for handling multiple file uploads
 * @param fieldName The name of the file input field
 * @param maxCount Maximum number of files allowed
 */
export const uploadMultipleFiles = (fieldName: string, maxCount: number = 5) => {
  return (req: Request, res: any, next: any) => {
    upload.array(fieldName, maxCount)(req, res, (err: any) => {
      if (err) {
        if (err instanceof MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new BadRequestException('File size is too large. Maximum size is 10MB.'));
          }
          if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_FIELD_KEY') {
            return next(new BadRequestException(`Maximum ${maxCount} files allowed.`));
          }
        }
        return next(new BadRequestException(err.message || 'Error uploading files.'));
      }
      next();
    });
  };
};

/**
 * Delete a file from the uploads directory
 * @param filename The name of the file to delete
 * @returns Promise that resolves when the file is deleted
 */
export const deleteFile = (filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    fs.unlink(filePath, (err) => {
      if (err) {
        logger.error(`Error deleting file ${filename}:`, err);
        reject(err);
      } else {
        logger.info(`File ${filename} deleted successfully`);
        resolve();
      }
    });
  });
};

/**
 * Get the public URL for an uploaded file
 * @param filename The name of the file
 * @returns The public URL for the file
 */
export const getFileUrl = (filename: string): string => {
  if (!filename) return '';
  return `${config.app.baseUrl}/uploads/${filename}`;
};

/**
 * Get file information
 * @param file The file object from multer
 * @returns File information
 */
export const getFileInfo = (file: Express.Multer.File) => {
  if (!file) return null;
  
  return {
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    url: getFileUrl(file.filename),
  };
};

/**
 * Validate file type
 * @param file The file to validate
 * @param allowedTypes Array of allowed MIME types
 * @returns boolean indicating if the file type is allowed
 */
export const validateFileType = (
  file: Express.Multer.File,
  allowedTypes: string[]
): boolean => {
  return allowedTypes.includes(file.mimetype);
};

/**
 * Validate file size
 * @param file The file to validate
 * @param maxSize Maximum file size in bytes
 * @returns boolean indicating if the file size is within limits
 */
export const validateFileSize = (
  file: Express.Multer.File,
  maxSize: number = MAX_FILE_SIZE
): boolean => {
  return file.size <= maxSize;
};

// Configure AWS
AWS.config.update({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
});

const s3 = new AWS.S3();

/**
 * Upload file to S3
 */
export const uploadToS3 = async (file: Express.Multer.File, folder: string): Promise<string> => {
  const fileExtension = file.originalname.split('.').pop();
  const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

  const uploadParams = {
    Bucket: config.aws.s3BucketName,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };

  try {
    const result = await s3.upload(uploadParams).promise();
    return result.Location;
  } catch (error) {
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Delete file from S3
 */
export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
  const key = fileUrl.split('.com/')[1]; // Extract key from URL

  const deleteParams = {
    Bucket: config.aws.s3BucketName,
    Key: key,
  };

  try {
    await s3.deleteObject(deleteParams).promise();
  } catch (error) {
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

/**
 * Generate presigned URL for file upload
 */
export const generatePresignedUrl = async (fileName: string, folder: string): Promise<string> => {
  const key = `${folder}/${uuidv4()}-${fileName}`;

  const params = {
    Bucket: config.aws.s3BucketName,
    Key: key,
    Expires: 3600, // 1 hour
    ContentType: 'application/octet-stream',
  };

  try {
    return await s3.getSignedUrlPromise('putObject', params);
  } catch (error) {
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

export default upload;
