import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

dotenv.config()
function arg(key, def) {
  const idx = process.argv.findIndex(a => a === `--${key}`)
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1]
  return def
}

const bucket = arg('bucket')
const prefix = arg('prefix', '')
const out = arg('out')
const concurrency = Number(arg('concurrency', '4'))

if (!bucket || !prefix) {
  console.error('Usage: node scripts/download-folder.js --bucket <bucket> --prefix <prefix> [--out <dir>] [--concurrency <n>]')
  process.exit(1)
}

const region = process.env.NUXT_S3_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1'
const accessKeyId = process.env.NUXT_S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.NUXT_S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
const endpoint = process.env.NUXT_S3_ENDPOINT || process.env.AWS_ENDPOINT

if (!accessKeyId || !secretAccessKey) {
  console.error('Missing credentials: set NUXT_S3_ACCESS_KEY_ID/NUXT_S3_SECRET_ACCESS_KEY or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY')
  process.exit(1)
}

const clientConfig = {
  region,
  credentials: { accessKeyId, secretAccessKey },
}
if (endpoint) {
  clientConfig.endpoint = endpoint
  clientConfig.forcePathStyle = true
}
const client = new S3Client(clientConfig)

const baseName = prefix.replace(/\/$/, '').split('/').pop() || 'folder'
const outRoot = out ? path.resolve(out) : path.resolve(process.cwd(), baseName)

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true })
}

async function fileExists(p) {
  try { await fsp.access(p, fs.constants.F_OK); return true } catch { return false }
}

async function downloadKey(key) {
  const relative = key.startsWith(prefix) ? key.slice(prefix.length) : key
  const destPath = path.join(outRoot, relative)
  await ensureDir(path.dirname(destPath))
  if (await fileExists(destPath)) return
  const resp = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  await pipeline(resp.Body, fs.createWriteStream(destPath))
}

async function run() {
  console.log(`Downloading s3://${bucket}/${prefix} -> ${outRoot}`)
  await ensureDir(outRoot)
  let continuation
  let total = 0
  const pool = new Set()
  async function add(task) {
    const p = task().catch(e => console.error(e)).finally(() => pool.delete(p))
    pool.add(p)
    if (pool.size >= concurrency) await Promise.race(pool)
  }
  do {
    const resp = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuation,
      MaxKeys: 1000,
    }))
    for (const obj of resp.Contents || []) {
      const key = obj.Key || ''
      if (key === prefix) continue
      const rel = key.startsWith(prefix) ? key.slice(prefix.length) : key
      if (!rel || rel.endsWith('/')) continue
      total++
      await add(() => downloadKey(key))
    }
    continuation = resp.NextContinuationToken
  } while (continuation)
  await Promise.all([...pool])
  console.log(`Done. Processed ${total} files.`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
