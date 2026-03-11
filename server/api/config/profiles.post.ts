import { upsertProfile, setActiveProfileId } from '../../utils/s3Profiles'
import { resetS3Client } from '../../utils/s3Client'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const profile = await upsertProfile({
    id: body?.id ? String(body.id) : undefined,
    name: String(body?.name || ''),
    region: String(body?.region || ''),
    endpoint: body?.endpoint ? String(body.endpoint) : undefined,
    defaultBucket: body?.defaultBucket ? String(body.defaultBucket) : undefined,
    accessKeyId: String(body?.accessKeyId || ''),
    secretAccessKey: body?.secretAccessKey ? String(body.secretAccessKey) : undefined,
  })

  if (body?.setActive) {
    await setActiveProfileId(profile.id)
    resetS3Client()
  }

  return { profile }
})
