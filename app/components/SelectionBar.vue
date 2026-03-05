<!-- components/SelectionBar.vue -->
<template>
  <Transition name="selection-bar">
    <div v-if="store.hasSelection" class="selection-bar">
      <span class="selection-count">{{ store.selectionCount }} selected</span>
      <div class="selection-divider" />
      <button class="btn" @click="store.downloadSelected()">⬇️ Download</button>
      <button class="btn btn-danger" @click="confirmDelete">🗑️ Delete</button>
      <button class="btn btn-icon" title="Clear selection" @click="store.clearSelection()">✕</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useS3Store } from '~/stores/s3'
const store = useS3Store()

async function confirmDelete() {
  if (confirm(`Delete ${store.selectionCount} selected item(s)? This cannot be undone.`)) {
    await store.deleteSelected()
  }
}
</script>
