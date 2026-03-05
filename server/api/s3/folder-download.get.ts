// server/api/s3/folder-download.get.ts
// GET /api/s3/folder-download?bucket=...&prefix=folder/
// Streams a ZIP archive of all objects under the given prefix
import archiver, { type Archiver } from 'archiver'
import { setHeader } from 'h3'
import { ListObjectsV2Command, GetObjectCommand, type ListObjectsV2Output } from '@aws-sdk/client-s3'
import { getS3Client } from '../../utils/s3Client'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const bucket = String(query.bucket || '')
  const prefix = String(query.prefix || '')

  if (!bucket || !prefix) {
    throw createError({ statusCode: 400, message: 'bucket and prefix are required' })
  }

  const client = getS3Client()

  const folderName = prefix.replace(/\/$/, '').split('/').pop() || 'folder'
  setHeader(event, 'Content-Type', 'application/zip')
  setHeader(event, 'Content-Disposition', `attachment; filename="${folderName}.zip"`)

  const archive = archiver('zip', { zlib: { level: 9 } })
  archive.on('warning', (err: any) => {
    if (err.code !== 'ENOENT') throw err
  })
  archive.on('error', (err: any) => { throw err })

  archive.pipe(event.node.res)

  let continuation: string | undefined = undefined
  do {
    const resp: ListObjectsV2Output = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuation,
      MaxKeys: 1000,
    }))

    for (const obj of resp.Contents || []) {
      const key = obj.Key || ''
      // Skip empty placeholder object equal to prefix itself
      if (key === prefix) continue

      const relative = key.startsWith(prefix) ? key.slice(prefix.length) : key
      if (!relative || relative.endsWith('/')) continue

      const file = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      archive.append(file.Body as any, { name: relative })
    }

    continuation = resp.NextContinuationToken
  } while (continuation)

  await archive.finalize()
})
