// server/api/s3/buckets.get.ts
// GET /api/s3/buckets — List all buckets

import { ListBucketsCommand, GetBucketLocationCommand } from '@aws-sdk/client-s3'
import { getS3Client } from '../../utils/s3Client'

export default defineEventHandler(async () => {
  const client = await getS3Client()
  const fallbackRegion = await (typeof (client as any).config.region === 'function'
    ? (client as any).config.region()
    : (client as any).config.region)

  const command = new ListBucketsCommand({})
  const response = await client.send(command)

  const all = (response.Buckets || []).map((b) => ({
    name: b.Name ?? '',
    creationDate: b.CreationDate,
  }))

  const buckets: Array<{ name: string; creationDate?: Date; region?: string }> = []
  const concurrency = 6
  for (let i = 0; i < all.length; i += concurrency) {
    const batch = all.slice(i, i + concurrency)
    const enriched = await Promise.all(batch.map(async (b) => {
      try {
        const loc = await client.send(new GetBucketLocationCommand({ Bucket: b.name }))
        const region = loc.LocationConstraint || fallbackRegion || 'us-east-1'
        return { ...b, region }
      }
      catch {
        return { ...b, region: fallbackRegion || undefined }
      }
    }))
    buckets.push(...enriched)
  }

  return { buckets }
})
