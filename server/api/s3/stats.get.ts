import { ListObjectsV2Command, type ListObjectsV2CommandInput } from '@aws-sdk/client-s3'
import { getS3Client } from '../../utils/s3Client'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const bucket = String(query.bucket || '')
  const prefix = String(query.prefix || '')

  if (!bucket) {
    throw createError({ statusCode: 400, message: 'bucket is required' })
  }

  const client = await getS3Client()

  let continuationToken: string | undefined = undefined
  let totalSize = 0
  let totalFiles = 0
  const folderPrefixes = new Set<string>()

  do {
    const input: ListObjectsV2CommandInput = {
      Bucket: bucket,
      Prefix: prefix || undefined,
      Delimiter: '/',
      MaxKeys: 1000,
      ContinuationToken: continuationToken,
    }

    const resp = await client.send(new ListObjectsV2Command(input))

    for (const cp of resp.CommonPrefixes || []) {
      const p = cp.Prefix
      if (p) folderPrefixes.add(p)
    }

    for (const obj of resp.Contents || []) {
      const key = obj.Key ?? ''
      if (!key) continue
      if (key === prefix) continue
      if (key.endsWith('/')) continue
      totalFiles += 1
      totalSize += obj.Size ?? 0
    }

    continuationToken = resp.NextContinuationToken
  } while (continuationToken)

  return {
    bucket,
    prefix,
    totalFolders: folderPrefixes.size,
    totalFiles,
    totalSize,
  }
})
