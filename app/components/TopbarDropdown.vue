<template>
  <div ref="root" class="dropdown">
    <button class="btn" :class="{ active: open }" @click="toggle">
      ⚙️
    </button>
    <div v-if="open" class="dropdown-menu">
      <div class="dropdown-group">
        <div class="dropdown-label">Theme</div>
        <select class="btn dropdown-select" style="cursor:pointer" :value="theme" @change="onThemeChange">
          <option v-for="opt in themeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div class="dropdown-sep" />
      <button class="dropdown-item" @click="openConfig">Manage Profiles</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme, type ThemeMode, THEME_OPTIONS } from '~/composables/useTheme'

const emit = defineEmits(['openConfig'])
const { theme, setTheme } = useTheme()
const themeOptions = THEME_OPTIONS
const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function openConfig() {
  emit('openConfig')
  close()
}

function onThemeChange(e: Event) {
  setTheme((e.target as HTMLSelectElement).value as ThemeMode)
  close()
}

function onOutside(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) close()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('click', onOutside)
  document.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  document.removeEventListener('click', onOutside)
  document.removeEventListener('keydown', onKey)
})
</script>
