import { deleteProfile } from '../../utils/s3Profiles'
import { resetS3Client } from '../../utils/s3Client'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const id = String(body?.id || '')
  if (!id) throw createError({ statusCode: 400, message: 'id is required' })
  await deleteProfile(id)
  resetS3Client()
  return { ok: true }
})
