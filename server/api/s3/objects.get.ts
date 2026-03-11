// server/api/s3/objects.get.ts
// GET /api/s3/objects?bucket=my-bucket&prefix=folder/&continuationToken=...

import {
  ListObjectsV2Command,
  type ListObjectsV2CommandInput,
} from '@aws-sdk/client-s3'
import { getS3Client } from '../../utils/s3Client'
import type { S3Object } from '../../../app/types/s3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const bucket = String(query.bucket || '')
  const prefix = String(query.prefix || '')
  const continuationToken = query.continuationToken
    ? String(query.continuationToken)
    : undefined
  const maxKeys = query.maxKeys ? Number(query.maxKeys) : 200

  if (!bucket) {
    throw createError({ statusCode: 400, message: 'bucket is required' })
  }

  const client = await getS3Client()

  const input: ListObjectsV2CommandInput = {
    Bucket: bucket,
    Prefix: prefix || undefined,
    Delimiter: '/',           // Virtual folders via common prefixes
    MaxKeys: maxKeys,
    ContinuationToken: continuationToken,
  }

  const response = await client.send(new ListObjectsV2Command(input))

  const objects: S3Object[] = []

  // Common prefixes = virtual folders
  for (const cp of response.CommonPrefixes || []) {
    const key = cp.Prefix ?? ''
    const name = key.replace(prefix, '').replace(/\/$/, '')
    objects.push({
      key,
      name,
      size: 0,
      isFolder: true,
      storageClass: undefined,
    })
  }

  // Actual objects (files)
  for (const obj of response.Contents || []) {
    const key = obj.Key ?? ''
    // Skip the "folder placeholder" object itself
    if (key === prefix) continue

    const name = key.replace(prefix, '')
    const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''

    objects.push({
      key,
      name,
      size: obj.Size ?? 0,
      lastModified: obj.LastModified,
      etag: obj.ETag?.replace(/"/g, ''),
      storageClass: obj.StorageClass,
      isFolder: false,
      contentType: ext,
    })
  }

  return {
    objects,
    prefix,
    bucket,
    continuationToken: response.NextContinuationToken,
    isTruncated: response.IsTruncated ?? false,
  }
})
