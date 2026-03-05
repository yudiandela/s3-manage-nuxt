// server/utils/s3Client.ts
// Singleton S3 client factory — used by all API routes

import {
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3'

let _client: S3Client | null = null

export function getS3Client(): S3Client {
  if (_client) return _client

  const config = useRuntimeConfig() as any

  const region = (config.awsRegion as string) || process.env.AWS_REGION || 'us-east-1'
  const accessKeyId = (config.awsAccessKeyId as string) || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = (config.awsSecretAccessKey as string) || process.env.AWS_SECRET_ACCESS_KEY
  const endpoint = (config.awsEndpoint as string) || process.env.AWS_ENDPOINT

  if (!accessKeyId || !secretAccessKey) {
    throw createError({
      statusCode: 500,
      message: 'AWS credentials are not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (and AWS_ENDPOINT for S3-compatible).',
    })
  }

  const clientConfig: S3ClientConfig = {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  }

  // Support custom endpoint (MinIO, R2, Spaces, etc.)
  if (endpoint) {
    clientConfig.endpoint = endpoint
    clientConfig.forcePathStyle = true // Required for most S3-compatible services
  }

  _client = new S3Client(clientConfig)
  return _client
}

// Allow re-initializing the client (e.g., after credential update)
export function resetS3Client(): void {
  _client = null
}
