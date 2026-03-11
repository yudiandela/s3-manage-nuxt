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
      <div class="status-badge">
        <div class="status-dot" />
        Connected
      </div>
      <ProfileSwitcher />
      <select class="btn" style="cursor:pointer" :value="theme" @change="onThemeChange">
        <option v-for="opt in themeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <button class="btn" @click="$emit('openConfig')">⚙️ Configure</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useS3Store } from '~/stores/s3'
import { useTheme, type ThemeMode, THEME_OPTIONS } from '~/composables/useTheme'
defineEmits(['openConfig'])
const store = useS3Store()
const { theme, setTheme } = useTheme()
const themeOptions = THEME_OPTIONS

function onThemeChange(e: Event) {
  setTheme((e.target as HTMLSelectElement).value as ThemeMode)
}
</script>
