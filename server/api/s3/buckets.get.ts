// server/api/s3/buckets.get.ts
// GET /api/s3/buckets — List all buckets

import { ListBucketsCommand } from '@aws-sdk/client-s3'
import { getS3Client } from '../../utils/s3Client'

export default defineEventHandler(async () => {
  const client = await getS3Client()

  const command = new ListBucketsCommand({})
  const response = await client.send(command)

  const buckets = (response.Buckets || []).map((b) => ({
    name: b.Name ?? '',
    creationDate: b.CreationDate,
  }))

  return { buckets }
})
