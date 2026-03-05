<!-- components/StatsBar.vue -->
<template>
  <div class="stats-row">
    <div class="stat-card" v-for="stat in stats" :key="stat.label">
      <div class="stat-icon" :style="{ background: stat.iconBg }">{{ stat.icon }}</div>
      <div class="stat-info">
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useS3Store } from '~/stores/s3'
import { formatBytes } from '~/utils/format'

const store = useS3Store()

const stats = computed(() => [
  {
    icon: '📁',
    iconBg: 'rgba(0,212,255,0.12)',
    value: store.stats.totalFolders,
    label: 'Folders',
  },
  {
    icon: '📄',
    iconBg: 'rgba(0,255,157,0.12)',
    value: store.stats.totalFiles,
    label: 'Files',
  },
  {
    icon: '💾',
    iconBg: 'rgba(255,165,2,0.12)',
    value: formatBytes(store.stats.totalSize),
    label: 'Total Size',
  },
  {
    icon: '🌐',
    iconBg: 'rgba(255,71,87,0.12)',
    value: store.stats.publicObjects,
    label: 'Public Objects',
  },
])
</script>
