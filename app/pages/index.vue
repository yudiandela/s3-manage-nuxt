<!-- pages/index.vue -->
<template>
  <div class="app">
    <!-- TOP BAR -->
    <AppTopbar @open-config="showConnect = true" />

    <!-- SIDEBAR -->
    <AppSidebar />

    <!-- MAIN -->
    <main class="main">
      <!-- TOOLBAR -->
      <div class="toolbar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input v-model="searchQuery" type="text" placeholder="Search files…" @input="store.setSearch(searchQuery)" />
        </div>

        <button class="btn" @click="showFolder = true">📁 New Folder</button>
        <button class="btn btn-primary" @click="showUpload = true">⬆️ Upload</button>

        <div class="toolbar-spacer" />

        <!-- Sort -->
        <select class="btn" style="cursor:pointer" @change="onSortChange">
          <option value="name-asc">Name ↑</option>
          <option value="name-desc">Name ↓</option>
          <option value="size-asc">Size ↑</option>
          <option value="date-desc">Date ↓</option>
        </select>

        <!-- View toggle -->
        <div class="view-toggle">
          <button :class="{ active: store.viewMode === 'grid' }" title="Grid view"
            @click="store.setViewMode('grid')">⊞</button>
          <button :class="{ active: store.viewMode === 'list' }" title="List view"
            @click="store.setViewMode('list')">≡</button>
        </div>

        <select class="btn" style="cursor:pointer" v-model="store.pageSize" @change="onPageSizeChange">
          <option :value="50">50 per page</option>
          <option :value="100">100 per page</option>
          <option :value="200">200 per page</option>
          <option :value="1000">1000 per page</option>
        </select>
      </div>

      <!-- CONTENT -->
      <div class="content-area">
        <!-- PATH BAR -->
        <div class="path-bar">
          <span @click="store.navigateTo('')">🪣</span>
          <span class="path-sep">/</span>
          <span class="path-current">{{ store.currentBucket || 'Select a bucket' }}</span>
          <template v-for="crumb in store.breadcrumbs" :key="crumb.prefix">
            <span class="path-sep">/</span>
            <span @click="store.navigateTo(crumb.prefix)">{{ crumb.label }}</span>
          </template>
        </div>

        <!-- STATS -->
        <StatsBar />

        <!-- FILE VIEWS -->
        <div v-if="store.loading && !store.objects.length" class="empty-state">
          <span class="loading-spinner" style="width:32px;height:32px;border-width:3px" />
          <div class="empty-state-title">Loading…</div>
        </div>

        <div v-else-if="!store.currentBucket" class="empty-state">
          <span class="empty-state-icon">🪣</span>
          <div class="empty-state-title">Select a bucket to get started</div>
          <div class="empty-state-sub">Or configure credentials to connect to your S3</div>
          <button class="btn btn-primary" style="margin-top:16px" @click="showConnect = true">
            🔗 Connect S3
          </button>
        </div>

        <template v-else>
          <FileGrid v-if="store.viewMode === 'grid'" @context-menu="onContextMenu" />
          <FileList v-else @context-menu="onContextMenu" />
        </template>
      </div>
    </main>

    <!-- SELECTION BAR -->
    <SelectionBar />

    <!-- MODALS -->
    <UploadModal v-model="showUpload" @done="toast.success('Files uploaded successfully!')" />
    <FolderModal v-model="showFolder" @done="toast.success('Folder created!')" />
    <ConnectModal v-model="showConnect" @connected="onConnected" />
    <RenameModal v-model="showRename" :target="renameTarget" @done="toast.success('Renamed successfully!')" />

    <!-- CONTEXT MENU -->
    <ContextMenu :visible="ctxVisible" :x="ctxX" :y="ctxY" :target="ctxTarget" @action="onCtxAction"
      @close="ctxVisible = false" />
  </div>
</template>

<script setup lang="ts">
import { useS3Store } from '~/stores/s3'
import { useToast } from '~/composables/useToast'
import type { S3Object, SortField, SortOrder } from '~/types/s3'

const store = useS3Store()
const toast = useToast()
const runtime = useRuntimeConfig()

// UI state
const showUpload = ref(false)
const showFolder = ref(false)
const showConnect = ref(false)
const showRename = ref(false)
const searchQuery = ref('')
const renameTarget = ref<S3Object | null>(null)

// Context menu state
const ctxVisible = ref(false)
const ctxX = ref(0)
const ctxY = ref(0)
const ctxTarget = ref<S3Object | null>(null)

// Load buckets on mount
onMounted(async () => {
  await store.fetchBuckets()
  const first = store.buckets[0]
  if (first) await store.selectBucket(first.name)
})

// Keyboard shortcuts
onMounted(() => {
  document.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
})

function onKey(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

  if (e.key === 'Escape') {
    store.clearSelection()
    ctxVisible.value = false
  }
  if (e.key === 'Delete' && store.hasSelection) {
    if (confirm(`Delete ${store.selectionCount} item(s)?`)) store.deleteSelected()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    e.preventDefault()
    store.selectAll()
  }
}

function onSortChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  const [field, order] = val.split('-') as [SortField, SortOrder]
  store.setSort({ field, order })
}

function onPageSizeChange(e: Event) {
  const size = Number((e.target as HTMLSelectElement).value)
  store.setPageSize(size)
}

function onContextMenu(event: MouseEvent, obj: S3Object) {
  ctxTarget.value = obj
  ctxX.value = Math.min(event.clientX, window.innerWidth - 200)
  ctxY.value = Math.min(event.clientY, window.innerHeight - 280)
  ctxVisible.value = true
}

async function onCtxAction(type: string, target: S3Object) {
  switch (type) {
    case 'open':
      if (target.isFolder) store.navigateTo(target.key)
      break
    case 'download':
      if (target.isFolder) {
        await store.downloadFolder(target.key)
        toast.success(`⬇️ Downloading folder: ${target.name}.zip`)
      }
      else {
        await store.downloadObject(target.key)
        toast.success(`⬇️ Downloading: ${target.name}`)
      }
      break
    case 'copyUrl': {
      const ep = (runtime.public?.s3Endpoint as string | undefined)?.replace(/\/$/, '')
      const url = ep
        ? `${ep}/${encodeURIComponent(store.currentBucket)}/${target.key.split('/').map(encodeURIComponent).join('/')}`
        : `https://${store.currentBucket}.s3.amazonaws.com/${target.key}`
      await navigator.clipboard.writeText(url)
      toast.info('🔗 URL copied to clipboard')
      break
    }
    case 'rename':
      renameTarget.value = target
      showRename.value = true
      break
    case 'delete':
      if (confirm(`Delete "${target.name}"? This cannot be undone.`)) {
        await store.deleteObjects([target.key])
        toast.success(`🗑️ Deleted: ${target.name}`)
      }
      break
    case 'makePublic':
      toast.success(`🌐 ${target.name} is now public`)
      break
    case 'makePrivate':
      toast.info(`🔒 ${target.name} is now private`)
      break
  }
}

function onConnected(_form: any) {
  toast.success(`🔗 Connected! Refreshing buckets…`)
  store.fetchBuckets()
}
</script>
