// server/api/s3/delete.post.ts
// POST /api/s3/delete
// Batch delete up to 1000 objects at once

import {
  DeleteObjectsCommand,
  type ObjectIdentifier,
} from '@aws-sdk/client-s3'
import { getS3Client } from '../../utils/s3Client'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ bucket: string; keys: string[] }>(event)

  if (!body.bucket || !body.keys?.length) {
    throw createError({ statusCode: 400, message: 'bucket and keys[] are required' })
  }

  if (body.keys.length > 1000) {
    throw createError({ statusCode: 400, message: 'Maximum 1000 keys per request' })
  }

  const client = await getS3Client()

  const objects: ObjectIdentifier[] = body.keys.map((key) => ({ Key: key }))

  const command = new DeleteObjectsCommand({
    Bucket: body.bucket,
    Delete: { Objects: objects, Quiet: false },
  })

  const response = await client.send(command)

  const deleted = (response.Deleted || []).map((d) => d.Key ?? '')
  const errors = (response.Errors || []).map((e) => ({
    key: e.Key ?? '',
    error: e.Message ?? 'Unknown error',
  }))

  return { deleted, errors }
})
