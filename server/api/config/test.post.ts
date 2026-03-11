import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const region = String(body?.region || 'us-east-1')
  const accessKeyId = String(body?.accessKeyId || '')
  const secretAccessKey = String(body?.secretAccessKey || '')
  const endpoint = body?.endpoint ? String(body.endpoint) : undefined

  if (!accessKeyId || !secretAccessKey) {
    throw createError({ statusCode: 400, message: 'accessKeyId and secretAccessKey are required' })
  }

  const client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  })

  const resp = await client.send(new ListBucketsCommand({}))
  const buckets = (resp.Buckets || []).map(b => b.Name).filter(Boolean)
  return { ok: true, buckets }
})
