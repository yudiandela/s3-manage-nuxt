// server/api/s3/folder.post.ts
// POST /api/s3/folder
// Creates a virtual "folder" (zero-byte object with trailing slash)

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getS3Client } from '../../utils/s3Client'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ bucket: string; prefix: string; name: string }>(event)

  if (!body.bucket || !body.name) {
    throw createError({ statusCode: 400, message: 'bucket and name are required' })
  }

  const client = getS3Client()

  // S3 folders are zero-byte objects with a trailing /
  const folderKey = body.prefix
    ? `${body.prefix.replace(/\/$/, '')}/${body.name}/`
    : `${body.name}/`

  await client.send(
    new PutObjectCommand({
      Bucket: body.bucket,
      Key: folderKey,
      Body: '',
      ContentType: 'application/x-directory',
    }),
  )

  return { key: folderKey, name: body.name }
})
