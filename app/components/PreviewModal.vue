<template>
  <Teleport to="body">
    <div class="modal-overlay" :class="{ open: modelValue }" @click.self="close">
      <div class="modal" style="width: 860px; max-width: 95vw;">
        <div class="modal-header">
          <div class="modal-title">👁️ Preview</div>
          <button class="modal-close" @click="close">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="!target || !url" class="empty-state">
            <span class="loading-spinner" />
            <div class="empty-state-title">Preparing preview…</div>
          </div>
          <div v-else>
            <div v-if="kind === 'image'" style="display:flex;justify-content:center">
              <img :src="url" :alt="target.name" style="max-width:100%;max-height:70vh;border-radius:8px" />
            </div>
            <div v-else-if="kind === 'video'">
              <video :src="url" controls style="width:100%;max-height:70vh;border-radius:8px" />
            </div>
            <div v-else-if="kind === 'audio'">
              <audio :src="url" controls style="width:100%" />
            </div>
            <div v-else-if="kind === 'pdf'" style="height:70vh">
              <iframe :src="url" style="width:100%;height:100%;border:0;border-radius:8px" />
            </div>
            <div v-else-if="kind === 'text'">
              <pre
                style="white-space:pre-wrap;word-wrap:break-word;max-height:70vh;overflow:auto">{{ textContent }}</pre>
            </div>
            <div v-else style="display:flex;align-items:center;gap:8px">
              <span>Cannot preview this file type.</span>
              <a class="btn" :href="url" target="_blank">Open</a>
            </div>
          </div>
        </div>
        <!-- <div class="modal-footer">
          <a v-if="url" class="btn" :href="url" target="_blank">Open in new tab</a>
          <button class="btn btn-primary" @click="close">Close</button>
        </div> -->
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { S3Object } from '~/types/s3'
import { useS3Store } from '~/stores/s3'
import { getFileExtension } from '~/utils/format'

const props = defineProps<{ modelValue: boolean; target: S3Object | null }>()
const emit = defineEmits(['update:modelValue'])
const store = useS3Store()

const url = ref<string | null>(null)
const kind = ref<'image' | 'video' | 'audio' | 'pdf' | 'text' | 'other'>('other')
const textContent = ref<string>('')

watch(() => props.modelValue, async (open) => {
  if (!open) return
  url.value = null
  textContent.value = ''
  kind.value = 'other'
  if (!props.target?.key || props.target.isFolder) return
  const u = await store.getDownloadUrl(props.target.key)
  url.value = u
  const ext = getFileExtension(props.target.name)
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']
  const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv']
  const audioExts = ['mp3', 'wav', 'flac', 'ogg', 'm4a']
  const textExts = ['txt', 'md', 'json', 'csv', 'xml', 'yaml', 'yml', 'log']
  if (imageExts.includes(ext)) kind.value = 'image'
  else if (videoExts.includes(ext)) kind.value = 'video'
  else if (audioExts.includes(ext)) kind.value = 'audio'
  else if (ext === 'pdf') kind.value = 'pdf'
  else if (textExts.includes(ext)) {
    kind.value = 'text'
    try {
      const r = await fetch(u)
      textContent.value = await r.text()
    } catch { }
  } else {
    kind.value = 'other'
  }
})

function close() { emit('update:modelValue', false) }
</script>
