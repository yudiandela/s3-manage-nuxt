<!-- components/FileList.vue -->
<template>
  <div v-if="!store.filteredObjects.length" class="empty-state">
    <span class="empty-state-icon">🪣</span>
    <div class="empty-state-title">{{ store.searchQuery ? 'No results found' : 'Folder is empty' }}</div>
  </div>

  <div v-else class="file-list-wrap">
    <!-- Header -->
    <div class="list-header">
      <div>
        <input type="checkbox" :checked="allSelected"
          @change="allSelected ? store.clearSelection() : store.selectAll()" />
      </div>
      <div @click="toggleSort('name')" class="sortable">
        Name {{ sortIcon('name') }}
      </div>
      <div @click="toggleSort('size')" class="sortable">
        Size {{ sortIcon('size') }}
      </div>
      <div @click="toggleSort('date')" class="sortable">
        Modified {{ sortIcon('date') }}
      </div>
      <div>Type</div>
      <div>Actions</div>
    </div>

    <!-- Rows -->
    <div v-for="obj in store.filteredObjects" :key="obj.key" class="list-item"
      :class="{ selected: store.isSelected(obj.key) }" @click="handleClick($event, obj)"
      @contextmenu.prevent="$emit('contextMenu', $event, obj)">
      <div><input type="checkbox" :checked="store.isSelected(obj.key)" @click.stop="store.toggleSelect(obj.key)" />
      </div>
      <div class="list-item-name">
        <span class="item-icon">{{ getFileEmoji(obj.name, obj.isFolder) }}</span>
        <span :title="obj.name">{{ obj.name }}</span>
      </div>
      <div class="list-item-size">{{ obj.isFolder ? '—' : formatBytes(obj.size) }}</div>
      <div class="list-item-date">{{ formatDateRelative(obj.lastModified) }}</div>
      <div class="list-item-type">
        <span class="type-badge" :style="badgeStyle(obj)">
          {{ badgeLabel(obj) }}
        </span>
      </div>
      <div class="list-item-actions" @click.stop>
        <button class="btn btn-icon" title="Download" @click="store.downloadObject(obj.key)">⬇️</button>
        <button class="btn btn-icon danger" title="Delete" @click="confirmDelete(obj)">🗑️</button>
      </div>
    </div>

    <!-- Load more -->
    <div v-if="store.isTruncated" class="load-more-row" @click="store.loadMore()">
      <span class="loading-spinner" v-if="store.loading" />
      <span v-else>Load more objects…</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useS3Store } from '~/stores/s3'
import type { S3Object, SortField } from '~/types/s3'
import { getFileEmoji, getTypeStyle, getFileExtension, formatBytes, formatDateRelative } from '~/utils/format'

const _emit = defineEmits<{
  (e: 'contextMenu', event: MouseEvent, obj: S3Object): void
}>()

const store = useS3Store()

const allSelected = computed(
  () =>
    store.filteredObjects.length > 0 &&
    store.filteredObjects.every((o) => store.isSelected(o.key)),
)

function toggleSort(field: SortField) {
  if (store.sortOptions.field === field) {
    store.setSort({ field, order: store.sortOptions.order === 'asc' ? 'desc' : 'asc' })
  }
  else {
    store.setSort({ field, order: 'asc' })
  }
}

function sortIcon(field: SortField) {
  if (store.sortOptions.field !== field) return ''
  return store.sortOptions.order === 'asc' ? '↑' : '↓'
}

function badgeStyle(obj: S3Object) {
  const ext = getFileExtension(obj.name)
  const ts = getTypeStyle(ext, obj.isFolder)
  return { background: ts.bg, color: ts.color }
}

function badgeLabel(obj: S3Object) {
  if (obj.isFolder) return 'DIR'
  const ext = getFileExtension(obj.name)
  return ext.toUpperCase() || 'FILE'
}

function handleClick(event: MouseEvent, obj: S3Object) {
  if (obj.isFolder && !event.ctrlKey && !event.metaKey) {
    store.navigateTo(obj.key)
  }
  else {
    store.toggleSelect(obj.key)
  }
}

async function confirmDelete(obj: S3Object) {
  if (confirm(`Delete "${obj.name}"? This cannot be undone.`)) {
    await store.deleteObjects([obj.key])
  }
}
</script>
