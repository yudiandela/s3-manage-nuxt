export interface S3Profile {
  id: string
  name: string
  region: string
  endpoint?: string
  defaultBucket?: string
  accessKeyId: string
  secretAccessKey: string
  createdAt: number
  updatedAt: number
}

export interface S3ProfilePublic {
  id: string
  name: string
  region: string
  endpoint?: string
  defaultBucket?: string
  accessKeyIdMasked?: string
  createdAt: number
  updatedAt: number
}
