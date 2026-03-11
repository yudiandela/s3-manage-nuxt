import { useStorage } from 'nitropack/runtime'
import type { S3Profile, S3ProfilePublic } from '../../app/types/config'

const PROFILES_KEY = 's3:profiles'
const ACTIVE_KEY = 's3:activeProfileId'

function now() {
  return Date.now()
}

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
}

function toPublicProfile(p: S3Profile): S3ProfilePublic {
  const masked = p.accessKeyId
    ? `${p.accessKeyId.slice(0, 4)}…${p.accessKeyId.slice(-4)}`
    : undefined
  return {
    id: p.id,
    name: p.name,
    region: p.region,
    endpoint: p.endpoint || undefined,
    defaultBucket: p.defaultBucket || undefined,
    accessKeyIdMasked: masked,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

async function readAll(): Promise<S3Profile[]> {
  const storage = useStorage('data')
  const v = await storage.getItem<S3Profile[] | null>(PROFILES_KEY)
  return Array.isArray(v) ? v : []
}

async function writeAll(profiles: S3Profile[]) {
  const storage = useStorage('data')
  await storage.setItem(PROFILES_KEY, profiles)
}

export async function listProfilesPublic() {
  const profiles = await readAll()
  const storage = useStorage('data')
  const activeProfileId = await storage.getItem<string | null>(ACTIVE_KEY)
  return {
    profiles: profiles.map(toPublicProfile),
    activeProfileId: activeProfileId || null,
  }
}

export async function getProfileById(id: string): Promise<S3Profile | null> {
  const profiles = await readAll()
  return profiles.find(p => p.id === id) || null
}

export async function setActiveProfileId(id: string | null) {
  const storage = useStorage('data')
  if (!id) {
    await storage.removeItem(ACTIVE_KEY)
    return
  }
  await storage.setItem(ACTIVE_KEY, id)
}

export async function getActiveProfile(): Promise<S3Profile | null> {
  const storage = useStorage('data')
  const id = await storage.getItem<string | null>(ACTIVE_KEY)
  if (!id) return null
  return getProfileById(id)
}

export async function upsertProfile(input: {
  id?: string
  name: string
  region: string
  endpoint?: string
  defaultBucket?: string
  accessKeyId?: string
  secretAccessKey?: string
}) {
  const profiles = await readAll()
  const id = input.id || generateId()
  const existingIdx = profiles.findIndex(p => p.id === id)

  const base: S3Profile | null = existingIdx >= 0 ? (profiles[existingIdx] ?? null) : null
  const next: S3Profile = {
    id,
    name: input.name,
    region: input.region,
    endpoint: input.endpoint || undefined,
    defaultBucket: input.defaultBucket || undefined,
    accessKeyId: input.accessKeyId?.trim()
      ? input.accessKeyId
      : (base?.accessKeyId || ''),
    secretAccessKey: input.secretAccessKey?.trim()
      ? input.secretAccessKey
      : (base?.secretAccessKey || ''),
    createdAt: base?.createdAt || now(),
    updatedAt: now(),
  }

  if (!next.accessKeyId) {
    throw createError({ statusCode: 400, message: 'accessKeyId is required' })
  }

  if (!next.secretAccessKey) {
    throw createError({ statusCode: 400, message: 'secretAccessKey is required' })
  }

  if (existingIdx >= 0) profiles[existingIdx] = next
  else profiles.push(next)

  await writeAll(profiles)
  return toPublicProfile(next)
}

export async function deleteProfile(id: string) {
  const profiles = await readAll()
  const next = profiles.filter(p => p.id !== id)
  await writeAll(next)

  const storage = useStorage('data')
  const activeId = await storage.getItem<string | null>(ACTIVE_KEY)
  if (activeId === id) await storage.removeItem(ACTIVE_KEY)
}
