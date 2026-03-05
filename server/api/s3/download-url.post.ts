// server/api/s3/download-url.post.ts
// POST /api/s3/download-url
// Returns a presigned GET URL (works for private objects too)

import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getS3Client } from '../../utils/s3Client'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ bucket: string; key: string; expiresIn?: number }>(event)

  if (!body.bucket || !body.key) {
    throw createError({ statusCode: 400, message: 'bucket and key are required' })
  }

  const client = getS3Client()

  const command = new GetObjectCommand({
    Bucket: body.bucket,
    Key: body.key,
    ResponseContentDisposition: `attachment; filename="${body.key.split('/').pop()}"`,
  })

  const expiresIn = body.expiresIn ?? 3600 // 1 hour default
  const downloadUrl = await getSignedUrl(client, command, { expiresIn })

  return { downloadUrl, expiresIn }
})
