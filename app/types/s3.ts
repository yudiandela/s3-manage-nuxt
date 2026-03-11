// types/s3.ts — Shared TypeScript interfaces for S3 Manager

export interface S3Bucket {
  name: string
  creationDate?: Date
  region?: string
}

export interface S3Object {
  key: string
  name: string
  size: number
  lastModified?: Date
  etag?: string
  storageClass?: string
  isFolder: boolean
  contentType?: string
  isPublic?: boolean
}

export interface S3Credentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
  endpoint?: string
  bucketName?: string
}

export interface UploadTask {
  id: string
  file: File
  key: string
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

export interface BreadcrumbItem {
  label: string
  prefix: string
}

export interface FileStats {
  totalFiles: number
  totalFolders: number
  totalSize: number
}

export type SortField = 'name' | 'size' | 'date'
export type SortOrder = 'asc' | 'desc'
export type ViewMode = 'grid' | 'list'

export interface SortOptions {
  field: SortField
  order: SortOrder
}

// API Response types
export interface ApiListObjectsResponse {
  objects: S3Object[]
  prefix: string
  bucket: string
  continuationToken?: string
  isTruncated: boolean
}

export interface ApiListBucketsResponse {
  buckets: S3Bucket[]
}

export interface ApiUploadUrlResponse {
  uploadUrl: string
  key: string
}

export interface ApiDeleteResponse {
  deleted: string[]
  errors: { key: string; error: string }[]
}

export interface ApiErrorResponse {
  error: string
  message: string
}
