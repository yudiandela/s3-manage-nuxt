// server/api/s3/rename.post.ts
// POST /api/s3/rename
// S3 has no native rename — this copies to new key then deletes the old one

import {
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getS3Client } from '../../utils/s3Client'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    bucket: string
    sourceKey: string
    destinationKey: string
  }>(event)

  if (!body.bucket || !body.sourceKey || !body.destinationKey) {
    throw createError({
      statusCode: 400,
      message: 'bucket, sourceKey, destinationKey are required',
    })
  }

  if (body.sourceKey === body.destinationKey) {
    throw createError({ statusCode: 400, message: 'Source and destination keys are identical' })
  }

  const client = await getS3Client()

  // Step 1: Copy to new key
  await client.send(
    new CopyObjectCommand({
      Bucket: body.bucket,
      CopySource: `${body.bucket}/${encodeURIComponent(body.sourceKey)}`,
      Key: body.destinationKey,
    }),
  )

  // Step 2: Delete original
  await client.send(
    new DeleteObjectCommand({
      Bucket: body.bucket,
      Key: body.sourceKey,
    }),
  )

  return { sourceKey: body.sourceKey, destinationKey: body.destinationKey }
})
