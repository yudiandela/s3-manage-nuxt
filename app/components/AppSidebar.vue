<!-- components/AppSidebar.vue -->
<template>
  <aside class="sidebar">
    <!-- Buckets -->
    <div class="sidebar-section">
      <div class="sidebar-label">Buckets</div>

      <div v-if="store.loading && !store.buckets.length" class="sidebar-loading">
        <span class="loading-spinner" /> Loading…
      </div>

      <div v-for="bucket in store.buckets" :key="bucket.name" class="bucket-item"
        :class="{ active: bucket.name === store.currentBucket }" @click="store.selectBucket(bucket.name)">
        <div class="bucket-icon">🪣</div>
        <div class="bucket-info">
          <div class="bucket-name">{{ bucket.name }}</div>
          <div class="bucket-meta">{{ bucket.region ?? 'unknown region' }}</div>
        </div>
      </div>
    </div>

    <!-- Quick filters -->
    <div class="sidebar-section">
      <div class="sidebar-label">Quick Access</div>
      <div v-for="f in quickFilters" :key="f.type" class="bucket-item" :class="{ active: activeFilter === f.type }"
        @click="toggleFilter(f.type)">
        <div class="bucket-icon">{{ f.icon }}</div>
        <div class="bucket-info">
          <div class="bucket-name">{{ f.label }}</div>
        </div>
      </div>
    </div>

    <!-- Storage gauge -->
    <div class="sidebar-storage">
      <div class="storage-bar-label">
        <span>Storage used</span>
        <span class="accent">{{ usedPct }}%</span>
      </div>
      <div class="storage-bar">
        <div class="storage-bar-fill" :style="{ width: usedPct + '%' }" />
      </div>
      <div class="storage-detail">
        {{ formatBytes(store.stats.totalSize) }} in current view
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useS3Store } from '~/stores/s3'
import { formatBytes } from '~/utils/format'

const store = useS3Store()
const activeFilter = ref<string | null>(null)

const quickFilters = [
  { type: 'images', icon: '🖼️', label: 'Images' },
  { type: 'docs', icon: '📄', label: 'Documents' },
  { type: 'archives', icon: '📦', label: 'Archives' },
]

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico']
const DOC_EXT = ['pdf', 'doc', 'docx', 'txt', 'md', 'csv', 'xls', 'xlsx']
const ARCHIVE_EXT = ['zip', 'gz', 'tar', '7z', 'rar']

function toggleFilter(type: string) {
  activeFilter.value = activeFilter.value === type ? null : type
  const q = activeFilter.value
  if (!q) { store.setSearch(''); return }

  const extMap: Record<string, string[]> = {
    images: IMAGE_EXT, docs: DOC_EXT, archives: ARCHIVE_EXT,
  }
  // Encode as a special "ext:" prefix so the store can filter by ext
  store.setSearch(`__ext:${extMap[q]?.join(',')}`)
}

// Fake storage 67 %
const usedPct = 67
</script>
