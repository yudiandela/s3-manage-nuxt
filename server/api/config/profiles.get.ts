import { listProfilesPublic } from '../../utils/s3Profiles'

export default defineEventHandler(async () => {
  return listProfilesPublic()
})
