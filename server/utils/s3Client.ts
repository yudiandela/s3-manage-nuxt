// server/utils/s3Client.ts
// Singleton S3 client factory — used by all API routes

import {
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3'
import { getActiveProfile } from './s3Profiles'

let _client: S3Client | null = null
let _clientKey: string | null = null

export async function getS3Client(): Promise<S3Client> {
  const config = useRuntimeConfig() as any
  const active = await getActiveProfile()

  const region = active?.region || (config.awsRegion as string) || process.env.AWS_REGION || 'us-east-1'
  const accessKeyId = active?.accessKeyId || (config.awsAccessKeyId as string) || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = active?.secretAccessKey || (config.awsSecretAccessKey as string) || process.env.AWS_SECRET_ACCESS_KEY
  const endpoint = active?.endpoint || (config.awsEndpoint as string) || process.env.AWS_ENDPOINT

  const keyBase = `${active?.id || 'env'}|${region}|${endpoint || ''}|${accessKeyId || ''}`
  if (_client && _clientKey === keyBase) return _client

  if (!accessKeyId || !secretAccessKey) {
    throw createError({
      statusCode: 500,
      message: 'S3 credentials are not configured. Add a profile in Configure, or set env credentials.',
    })
  }

  const clientConfig: S3ClientConfig = {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  }

  if (endpoint) {
    clientConfig.endpoint = endpoint
    clientConfig.forcePathStyle = true
  }

  _clientKey = keyBase
  _client = new S3Client(clientConfig)
  return _client
}

// Allow re-initializing the client (e.g., after credential update)
export function resetS3Client(): void {
  _client = null
  _clientKey = null
}
