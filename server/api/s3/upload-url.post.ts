// server/api/s3/upload-url.post.ts
// POST /api/s3/upload-url
// Generates a presigned PUT URL — the browser uploads directly to S3
// (avoids routing large files through the server)

import { PutObjectCommand, StorageClass } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getS3Client } from '../../utils/s3Client'

interface UploadUrlBody {
  bucket: string
  key: string
  contentType?: string
  contentLength?: number
  storageClass?: string
  isPublic?: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<UploadUrlBody>(event)

  if (!body.bucket || !body.key) {
    throw createError({ statusCode: 400, message: 'bucket and key are required' })
  }

  const client = await getS3Client()

  const command = new PutObjectCommand({
    Bucket: body.bucket,
    Key: body.key,
    ContentType: body.contentType || 'application/octet-stream',
    ...(body.storageClass && { StorageClass: body.storageClass as StorageClass }),
    ...(body.isPublic && { ACL: 'public-read' }),
  })

  // URL expires in 15 minutes
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 })

  return { uploadUrl, key: body.key }
})
