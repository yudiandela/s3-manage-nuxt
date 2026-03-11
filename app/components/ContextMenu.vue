<!-- components/ContextMenu.vue -->
<template>
  <Teleport to="body">
    <div v-if="visible" ref="menuEl" class="ctx-menu open" :style="{ left: x + 'px', top: y + 'px' }">
      <div class="ctx-item" @click="action('open')">
        {{ target?.isFolder ? '📂 Open Folder' : '👁️ Preview' }}
      </div>
      <div class="ctx-item" @click="action('download')">⬇️ Download</div>
      <div class="ctx-item" @click="action('copyUrl')">🔗 Copy URL</div>
      <div class="ctx-item" @click="action('rename')">✏️ Rename</div>
      <div class="ctx-sep" />
      <div class="ctx-item danger" @click="action('delete')">🗑️ Delete</div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { S3Object } from '~/types/s3'

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  target: S3Object | null
}>()

const emit = defineEmits<{
  (e: 'action', type: string, target: S3Object): void
  (e: 'close'): void
}>()

const menuEl = ref<HTMLElement | null>(null)

function action(type: string) {
  if (props.target) emit('action', type, props.target)
  emit('close')
}

// Close on outside click
onMounted(() => {
  document.addEventListener('click', onOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onOutside)
})

function onOutside(e: MouseEvent) {
  if (menuEl.value && !menuEl.value.contains(e.target as Node)) {
    emit('close')
  }
}
</script>
