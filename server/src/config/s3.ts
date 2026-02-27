import AWS from 'aws-sdk';
import { env } from './env';

export const s3 = new AWS.S3({
  accessKeyId: env.aws.accessKeyId,
  secretAccessKey: env.aws.secretAccessKey,
  region: env.aws.region,
});

export const S3_BUCKET = env.aws.s3Bucket;
