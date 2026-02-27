import { s3, S3_BUCKET } from '../config/s3';
import { logger } from '../utils/logger';

/**
 * Generate a signed download URL for an S3 key (valid 1 hour).
 */
export function getSignedUrl(s3Key: string, expiresInSeconds = 3600): string {
  return s3.getSignedUrl('getObject', {
    Bucket: S3_BUCKET,
    Key: s3Key,
    Expires: expiresInSeconds,
  });
}

/**
 * Delete an object from S3.
 */
export async function deleteS3Object(s3Key: string): Promise<void> {
  try {
    await s3.deleteObject({ Bucket: S3_BUCKET, Key: s3Key }).promise();
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
    await s3.headObject({ Bucket: S3_BUCKET, Key: s3Key }).promise();
    return true;
  } catch {
    return false;
  }
}
