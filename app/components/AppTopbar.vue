<!-- components/AppTopbar.vue -->
<template>
  <header class="topbar">
    <div class="logo">
      <div class="logo-icon">S3</div>
      S3 Manager
    </div>
    <div class="topbar-divider" />

    <nav class="breadcrumb">
      <span @click="store.navigateTo('')">buckets</span>
      <span class="sep">/</span>
      <span v-if="store.currentBucket" class="current">{{ store.currentBucket }}</span>
      <template v-for="crumb in store.breadcrumbs" :key="crumb.prefix">
        <span class="sep">/</span>
        <span @click="store.navigateTo(crumb.prefix)">{{ crumb.label }}</span>
      </template>
    </nav>

    <div class="topbar-actions">
      <div class="status-badge btn">
        <div class="status-dot" />
        Connected
      </div>
      <ProfileSwitcher />
      <TopbarDropdown @open-config="$emit('openConfig')" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { useS3Store } from '~/stores/s3'
defineEmits(['openConfig'])
const store = useS3Store()
</script>
