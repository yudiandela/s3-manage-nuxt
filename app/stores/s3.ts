// stores/s3.ts
// Central Pinia store for all S3 state and actions

import { defineStore } from 'pinia'
import type {
  S3Bucket,
  S3Object,
  UploadTask,
  SortOptions,
  ViewMode,
  FileStats,
} from '~/types/s3'
import type { S3ProfilePublic } from '~/types/config'
import { generateId, buildS3Key } from '~/utils/format'

export const useS3Store = defineStore('s3', () => {
  // ─── State ───────────────────────────────────────────────
  const buckets = ref<S3Bucket[]>([])
  const currentBucket = ref<string>('')
  const currentPrefix = ref<string>('')
  const objects = ref<S3Object[]>([])
  const selectedKeys = ref<Set<string>>(new Set())
  const loading = ref(false)
  const uploading = ref(false)
  const uploadTasks = ref<UploadTask[]>([])
  const viewMode = ref<ViewMode>('grid')
  const sortOptions = ref<SortOptions>({ field: 'name', order: 'asc' })
  const searchQuery = ref('')
  const pageIndex = ref(0)
  const pageTokens = ref<Array<string | undefined>>([undefined])
  const nextToken = ref<string | undefined>(undefined)
  const isTruncated = ref(false)
  const error = ref<string | null>(null)
  const pageSize = ref<number>(200)
  const activeProfile = ref<S3ProfilePublic | null>(null)
  const activeProfileId = ref<string | null>(null)
  const profiles = ref<S3ProfilePublic[]>([])

  // ─── Computed ─────────────────────────────────────────────
  const filteredObjects = computed(() => {
    let result = objects.value.slice()

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter((o) => o.name.toLowerCase().includes(q))
    }

    result.sort((a, b) => {
      // Folders always first
      if (a.isFolder && !b.isFolder) return -1
      if (!a.isFolder && b.isFolder) return 1

      const { field, order } = sortOptions.value
      let cmp = 0
      if (field === 'name') cmp = a.name.localeCompare(b.name)
      else if (field === 'size') cmp = a.size - b.size
      else if (field === 'date')
        cmp = (a.lastModified?.getTime() ?? 0) - (b.lastModified?.getTime() ?? 0)

      return order === 'asc' ? cmp : -cmp
    })

    return result
  })

  const stats = computed<FileStats>(() => {
    const files = objects.value.filter((o) => !o.isFolder)
    return {
      totalFiles: files.length,
      totalFolders: objects.value.filter((o) => o.isFolder).length,
      totalSize: files.reduce((s, o) => s + o.size, 0),
      publicObjects: objects.value.filter((o) => o.isPublic).length,
    }
  })

  const breadcrumbs = computed(() => {
    if (!currentPrefix.value) return []
    const parts = currentPrefix.value.replace(/\/$/, '').split('/')
    return parts.map((label, i) => ({
      label,
      prefix: parts.slice(0, i + 1).join('/') + '/',
    }))
  })

  const hasSelection = computed(() => selectedKeys.value.size > 0)
  const selectionCount = computed(() => selectedKeys.value.size)
  const canPrevPage = computed(() => pageIndex.value > 0)
  const canNextPage = computed(() => Boolean(pageTokens.value[pageIndex.value + 1]))

  // ─── Actions ──────────────────────────────────────────────

  function resetPaging() {
    pageIndex.value = 0
    pageTokens.value = [undefined]
    nextToken.value = undefined
    isTruncated.value = false
  }

  async function fetchBuckets() {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch('/api/s3/buckets')
      buckets.value = (data.buckets || []).map((b: any) => ({
        ...b,
        creationDate: b.creationDate ? new Date(b.creationDate) : undefined,
      }))
    }
    catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Failed to load buckets'
      buckets.value = []
    }
    finally {
      loading.value = false
    }
  }

  async function fetchActiveProfile() {
    try {
      const data = await $fetch('/api/config/active')
      activeProfile.value = data.activeProfile || null
      activeProfileId.value = data.activeProfileId || null
    }
    catch {
      activeProfile.value = null
      activeProfileId.value = null
    }
  }

  async function fetchProfiles() {
    try {
      const data = await $fetch('/api/config/profiles')
      profiles.value = data.profiles || []
      activeProfileId.value = data.activeProfileId || null
      activeProfile.value = activeProfileId.value
        ? profiles.value.find(p => p.id === activeProfileId.value) || null
        : null
    }
    catch {
      profiles.value = []
      activeProfileId.value = null
      activeProfile.value = null
    }
  }

  async function switchProfile(id: string | null) {
    currentBucket.value = ''
    currentPrefix.value = ''
    objects.value = []
    buckets.value = []
    selectedKeys.value = new Set()
    resetPaging()

    await $fetch('/api/config/active', { method: 'POST', body: { id } })
    await fetchProfiles()
    await fetchBuckets()
    if (!buckets.value.length) return
    const nextBucket = activeProfile.value?.defaultBucket
    if (nextBucket && buckets.value.some(b => b.name === nextBucket)) {
      await selectBucket(nextBucket)
      return
    }
    const first = buckets.value[0]?.name
    if (first) await selectBucket(first)
  }

  async function selectBucket(name: string) {
    currentBucket.value = name
    currentPrefix.value = ''
    selectedKeys.value = new Set()
    resetPaging()
    await fetchObjects()
  }

  async function fetchObjects() {
    if (!currentBucket.value) return
    loading.value = true
    error.value = null

    objects.value = []

    try {
      const params: Record<string, string> = {
        bucket: currentBucket.value,
        prefix: currentPrefix.value,
      }
      if (pageSize.value) params.maxKeys = String(pageSize.value)
      const token = pageTokens.value[pageIndex.value]
      if (token) params.continuationToken = token

      const data = await $fetch('/api/s3/objects', { params })

      objects.value = (data.objects || []).map((o: any) => ({
        ...o,
        lastModified: o.lastModified ? new Date(o.lastModified) : undefined,
      }))

      nextToken.value = data.continuationToken
      isTruncated.value = data.isTruncated
      if (nextToken.value) {
        pageTokens.value[pageIndex.value + 1] = nextToken.value
      }
      else {
        pageTokens.value = pageTokens.value.slice(0, pageIndex.value + 1)
      }
    }
    catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Failed to load objects'
      objects.value = []
      nextToken.value = undefined
      isTruncated.value = false
    }
    finally {
      loading.value = false
    }
  }

  async function navigateTo(prefix: string) {
    currentPrefix.value = prefix
    selectedKeys.value = new Set()
    resetPaging()
    await fetchObjects()
  }

  async function nextPage() {
    if (!canNextPage.value) return
    pageIndex.value += 1
    selectedKeys.value = new Set()
    await fetchObjects()
  }

  async function prevPage() {
    if (!canPrevPage.value) return
    pageIndex.value -= 1
    selectedKeys.value = new Set()
    await fetchObjects()
  }

  async function loadMore() {
    await nextPage()
  }
  function setPageSize(size: number) {
    pageSize.value = size
    resetPaging()
    fetchObjects()
  }

  // ─── Selection ────────────────────────────────────────────

  function toggleSelect(key: string) {
    const next = new Set(selectedKeys.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    selectedKeys.value = next
  }

  function selectAll() {
    selectedKeys.value = new Set(filteredObjects.value.map((o) => o.key))
  }

  function clearSelection() {
    selectedKeys.value = new Set()
  }

  function isSelected(key: string) {
    return selectedKeys.value.has(key)
  }

  // ─── Upload ───────────────────────────────────────────────

  async function uploadFiles(
    files: File[],
    options: { storageClass?: string; isPublic?: boolean } = {},
  ) {
    uploading.value = true
    const tasks: UploadTask[] = files.map((f) => ({
      id: generateId(),
      file: f,
      key: buildS3Key(currentPrefix.value, f.name),
      progress: 0,
      status: 'pending',
    }))

    uploadTasks.value = tasks

    await Promise.all(
      tasks.map(async (task) => {
        try {
          task.status = 'uploading'

          // 1) Get presigned URL from server
          const { uploadUrl } = await $fetch('/api/s3/upload-url', {
            method: 'POST',
            body: {
              bucket: currentBucket.value,
              key: task.key,
              contentType: task.file.type || 'application/octet-stream',
              contentLength: task.file.size,
              storageClass: options.storageClass,
              isPublic: options.isPublic,
            },
          })

          // 2) Upload directly from browser to S3 using XHR (for progress)
          await uploadWithProgress(task, uploadUrl)

          task.status = 'done'
          task.progress = 100
        }
        catch (e: any) {
          task.status = 'error'
          task.error = e?.message || 'Upload failed'
        }
      }),
    )

    uploading.value = false

    const succeeded = tasks.filter((t) => t.status === 'done').length
    if (succeeded > 0) await fetchObjects()

    return tasks
  }

  function uploadWithProgress(task: UploadTask, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', url)
      xhr.setRequestHeader('Content-Type', task.file.type || 'application/octet-stream')

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          task.progress = Math.round((e.loaded / e.total) * 100)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
      })

      xhr.addEventListener('error', () => reject(new Error('Network error')))
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

      xhr.send(task.file)
    })
  }

  function clearUploadTasks() {
    uploadTasks.value = []
  }

  // ─── Delete ───────────────────────────────────────────────

  async function deleteObjects(keys: string[]) {
    const data = await $fetch('/api/s3/delete', {
      method: 'POST',
      body: { bucket: currentBucket.value, keys },
    })
    clearSelection()
    await fetchObjects()
    return data
  }

  async function deleteSelected() {
    return deleteObjects([...selectedKeys.value])
  }

  // ─── Folder ───────────────────────────────────────────────

  async function createFolder(name: string) {
    await $fetch('/api/s3/folder', {
      method: 'POST',
      body: {
        bucket: currentBucket.value,
        prefix: currentPrefix.value,
        name,
      },
    })
    await fetchObjects()
  }

  // ─── Rename ───────────────────────────────────────────────

  async function renameObject(sourceKey: string, newName: string) {
    const parts = sourceKey.split('/')
    parts[parts.length - 1] = newName
    const destinationKey = parts.join('/')

    await $fetch('/api/s3/rename', {
      method: 'POST',
      body: {
        bucket: currentBucket.value,
        sourceKey,
        destinationKey,
      },
    })
    await fetchObjects()
    return destinationKey
  }

  // ─── Download ─────────────────────────────────────────────

  async function getDownloadUrl(key: string): Promise<string> {
    const data = await $fetch('/api/s3/download-url', {
      method: 'POST',
      body: { bucket: currentBucket.value, key },
    })
    return data.downloadUrl
  }

  async function downloadObject(key: string) {
    const url = await getDownloadUrl(key)
    const a = document.createElement('a')
    a.href = url
    a.download = key.split('/').pop() || key
    a.click()
  }

  async function downloadFolder(prefix: string) {
    const url = `/api/s3/folder-download?bucket=${encodeURIComponent(currentBucket.value)}&prefix=${encodeURIComponent(prefix)}`
    const a = document.createElement('a')
    a.href = url
    a.download = (prefix.replace(/\/$/, '').split('/').pop() || 'folder') + '.zip'
    a.click()
  }

  async function downloadSelected() {
    await Promise.all([...selectedKeys.value].map((key) => downloadObject(key)))
    clearSelection()
  }

  // ─── Misc ─────────────────────────────────────────────────

  function setViewMode(mode: ViewMode) { viewMode.value = mode }
  function setSort(options: SortOptions) { sortOptions.value = options }
  function setSearch(q: string) { searchQuery.value = q }

  return {
    // State
    buckets, currentBucket, currentPrefix,
    objects, selectedKeys, loading, uploading,
    uploadTasks, viewMode, sortOptions,
    searchQuery, isTruncated, error,
    pageSize,
    activeProfile,
    activeProfileId,
    profiles,
    pageIndex,
    // Computed
    filteredObjects, stats, breadcrumbs,
    hasSelection, selectionCount,
    canPrevPage, canNextPage,
    // Actions
    fetchBuckets, selectBucket,
    fetchActiveProfile,
    fetchProfiles,
    switchProfile,
    fetchObjects, navigateTo, loadMore,
    nextPage, prevPage,
    setPageSize,
    toggleSelect, selectAll, clearSelection, isSelected,
    uploadFiles, clearUploadTasks,
    deleteObjects, deleteSelected,
    createFolder,
    renameObject,
    getDownloadUrl, downloadObject, downloadFolder, downloadSelected,
    setViewMode, setSort, setSearch,
  }
})
