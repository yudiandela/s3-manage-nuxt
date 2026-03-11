import { listProfilesPublic } from '../../utils/s3Profiles'

export default defineEventHandler(async () => {
  const { profiles, activeProfileId } = await listProfilesPublic()
  const activeProfile = activeProfileId
    ? profiles.find(p => p.id === activeProfileId) || null
    : null
  return { activeProfileId, activeProfile }
})
