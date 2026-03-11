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

    <!-- Storage gauge -->
    <div class="sidebar-storage">
      <div class="storage-bar-label">
        <span>Storage used</span>
        <span class="accent">{{ usedLabel }}</span>
      </div>
      <div class="storage-bar">
        <div class="storage-bar-fill" :style="{ width: usedPct + '%' }" />
      </div>
      <div class="storage-detail">
        {{ usedDetail }}
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useS3Store } from '~/stores/s3'
import { formatBytes } from '~/utils/format'

const store = useS3Store()

const usedBytes = computed(() => store.folderTotals?.totalSize ?? store.stats.totalSize)
const usedPct = computed(() => (usedBytes.value > 0 ? 100 : 0))
const usedLabel = computed(() => (store.folderTotalsLoading ? `${formatBytes(usedBytes.value)}` : formatBytes(usedBytes.value)))
const usedDetail = computed(() => (store.folderTotalsLoading ? 'Calculating folder totals…' : 'Total size in current folder'))
</script>
