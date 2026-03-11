import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import path from 'path';
import crypto from 'crypto';

// S3 client for multer-s3 v3
const s3Client = new S3Client({
  region: env.aws.region,
  credentials: {
    accessKeyId: env.aws.accessKeyId,
    secretAccessKey: env.aws.secretAccessKey,
  },
});

/**
 * Creates a multer upload configured for a specific S3 path prefix.
 * @param prefix - S3 key prefix, e.g. "production/print" or "months/media"
 */
export function createUploader(prefix: string) {
  return multer({
    storage: multerS3({
      s3: s3Client as any,
      bucket: env.aws.s3Bucket,
      metadata: (_req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (_req, file, cb) => {
        const uniqueId = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname);
        const safeName = file.originalname
          .replace(ext, '')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .substring(0, 60);
        const key = `${prefix}/${Date.now()}_${uniqueId}_${safeName}${ext}`;
        cb(null, key);
      },
      contentType: multerS3.AUTO_CONTENT_TYPE,
    }),
    limits: {
      fileSize: 500 * 1024 * 1024, // 500MB (no strict limits per spec)
    },
  });
}

/** General media upload (images/videos) */
export const mediaUpload = createUploader('media');

/** Print-ready file upload */
export const printReadyUpload = createUploader('production/print-ready');

/** General-purpose upload (used in routes for simple single-file uploads) */
export const upload = createUploader('uploads');
