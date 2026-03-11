import { setActiveProfileId } from '../../utils/s3Profiles'
import { resetS3Client } from '../../utils/s3Client'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const id = body?.id ? String(body.id) : null
  await setActiveProfileId(id)
  resetS3Client()
  return { ok: true }
})
