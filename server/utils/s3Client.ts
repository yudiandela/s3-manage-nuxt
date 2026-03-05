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

  const clientConfig: S3ClientConfig = {
    region: (config.awsRegion as string) || 'us-east-1',
    credentials: {
      accessKeyId: config.awsAccessKeyId as string,
      secretAccessKey: config.awsSecretAccessKey as string,
    },
  }

  // Support custom endpoint (MinIO, R2, Spaces, etc.)
  if (config.awsEndpoint) {
    clientConfig.endpoint = config.awsEndpoint as string
    clientConfig.forcePathStyle = true // Required for most S3-compatible services
  }

  _client = new S3Client(clientConfig)
  return _client
}

// Allow re-initializing the client (e.g., after credential update)
export function resetS3Client(): void {
  _client = null
}
