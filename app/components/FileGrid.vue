<!-- components/FileGrid.vue -->
<template>
  <!-- Empty state -->
  <div v-if="!store.filteredObjects.length" class="empty-state">
    <span class="empty-state-icon">🪣</span>
    <div class="empty-state-title">
      {{ store.searchQuery ? 'No results found' : 'Folder is empty' }}
    </div>
    <div class="empty-state-sub">Upload files or create a folder to get started</div>
  </div>

  <!-- Grid -->
  <div v-else class="file-grid">
    <div v-for="obj in store.filteredObjects" :key="obj.key" class="file-card"
      :class="{ selected: store.isSelected(obj.key) }" @click="handleClick($event, obj)"
      @contextmenu.prevent="$emit('contextMenu', $event, obj)">
      <!-- Checkmark badge -->
      <div v-if="store.isSelected(obj.key)" class="check-badge">✓</div>

      <div class="file-thumb" :style="thumbStyle(obj)">
        {{ getFileEmoji(obj.name, obj.isFolder) }}
      </div>
      <div class="file-name" :title="obj.name">{{ obj.name }}</div>
      <div class="file-meta">
        {{ obj.isFolder ? '—' : formatBytes(obj.size) }}
      </div>
    </div>
  </div>

  <div v-if="store.filteredObjects.length && (store.canPrevPage || store.canNextPage)" class="pagination-bar" @click.stop>
    <button class="btn" :disabled="!store.canPrevPage || store.loading" @click="store.prevPage()">Prev</button>
    <div class="pagination-page">Page {{ store.pageIndex + 1 }}</div>
    <button class="btn" :disabled="!store.canNextPage || store.loading" @click="store.nextPage()">Next</button>
  </div>
</template>

<script setup lang="ts">
import { useS3Store } from '~/stores/s3'
import type { S3Object } from '~/types/s3'
import { getFileEmoji, getTypeStyle, getFileExtension, formatBytes } from '~/utils/format'

const _emit = defineEmits<{
  (e: 'contextMenu', event: MouseEvent, obj: S3Object): void
}>()

const store = useS3Store()

function thumbStyle(obj: S3Object) {
  const ext = getFileExtension(obj.name)
  const ts = getTypeStyle(ext, obj.isFolder)
  return { background: ts.bg }
}

function handleClick(event: MouseEvent, obj: S3Object) {
  if (event.ctrlKey || event.metaKey || event.shiftKey || store.hasSelection) {
    store.toggleSelect(obj.key)
  }
  else if (obj.isFolder) {
    store.navigateTo(obj.key)
  }
  else {
    // single-click on file = just preview/select
    store.toggleSelect(obj.key)
  }
}
</script>
