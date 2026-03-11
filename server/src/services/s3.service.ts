import { GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3, S3_BUCKET } from '../config/s3.js';
import { logger } from '../utils/logger.js';

/**
 * Generate a signed download URL for an S3 key (valid 1 hour).
 */
export async function getSignedUrl(s3Key: string, expiresInSeconds = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
    });
    return await getS3SignedUrl(s3, command, { expiresIn: expiresInSeconds });
  } catch (error) {
    logger.error(`Failed to generate signed URL for ${s3Key}:`, error);
    throw error;
  }
}

/**
 * Delete an object from S3.
 */
export async function deleteS3Object(s3Key: string): Promise<void> {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }));
    logger.info(`S3 object deleted: ${s3Key}`);
  } catch (error) {
    logger.error(`Failed to delete S3 object ${s3Key}:`, error);
    throw error;
  }
}

/** Alias for deleteS3Object */
export const deleteFile = deleteS3Object;

/**
 * Check if an S3 object exists.
 */
export async function s3ObjectExists(s3Key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }));
    return true;
  } catch {
    return false;
  }
}
