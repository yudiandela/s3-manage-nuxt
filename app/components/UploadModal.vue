<!-- components/UploadModal.vue -->
<template>
  <Teleport to="body">
    <div class="modal-overlay" :class="{ open: modelValue }" @click.self="close">
      <div class="modal" style="width: 500px">
        <div class="modal-header">
          <div class="modal-title">⬆️ Upload Files</div>
          <button class="modal-close" @click="close">✕</button>
        </div>

        <div class="modal-body">
          <!-- Drop Zone -->
          <div class="drop-zone" :class="{ dragover: isDragging }" @click="fileInput?.click()"
            @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop.prevent="onDrop">
            <span class="drop-zone-icon">☁️</span>
            <div class="drop-zone-text">Drop files here or click to browse</div>
            <div class="drop-zone-sub">Max 5 GB per file · All file types supported</div>
          </div>

          <input ref="fileInput" type="file" multiple hidden @change="onFileSelect" />

          <!-- Upload Options -->
          <div class="settings-grid">
            <div class="form-group">
              <label class="form-label">Storage Class</label>
              <select v-model="storageClass" class="form-input">
                <option value="STANDARD">STANDARD — Frequent Access</option>
                <option value="STANDARD_IA">STANDARD_IA — Infrequent</option>
                <option value="GLACIER">GLACIER — Archive</option>
                <option value="INTELLIGENT_TIERING">INTELLIGENT_TIERING — Auto</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Access</label>
              <select v-model="isPublic" class="form-input">
                <option :value="false">🔒 Private</option>
                <option :value="true">🌐 Public Read</option>
              </select>
            </div>
          </div>

          <!-- Upload path -->
          <div class="form-group">
            <label class="form-label">Destination Prefix</label>
            <input v-model="uploadPrefix" class="form-input" :placeholder="store.currentPrefix || '/'" />
          </div>

          <!-- Progress list -->
          <div v-if="store.uploadTasks.length" class="upload-progress">
            <div v-for="task in store.uploadTasks" :key="task.id" class="progress-item">
              <span class="progress-name">{{ task.file.name }}</span>
              <span class="progress-status" :class="task.status">
                {{ statusLabel(task.status) }}
              </span>
              <div class="progress-bar-wrap">
                <div class="progress-bar-fill" :style="{ width: task.progress + '%' }"
                  :class="{ error: task.status === 'error' }" />
              </div>
              <span class="progress-pct">{{ task.progress }}%</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn" @click="close">Cancel</button>
          <button class="btn btn-primary" :disabled="!pendingFiles.length || store.uploading" @click="startUpload">
            <span v-if="store.uploading" class="loading-spinner" />
            <span v-else>⬆️ Upload {{ pendingFiles.length ? `(${pendingFiles.length})` : '' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useS3Store } from '~/stores/s3'

const _props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue', 'done'])
const store = useS3Store()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const pendingFiles = ref<File[]>([])
const storageClass = ref('STANDARD')
const isPublic = ref(false)
const uploadPrefix = ref('')

function close() {
  emit('update:modelValue', false)
  store.clearUploadTasks()
  pendingFiles.value = []
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  pendingFiles.value = Array.from(input.files || [])
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  pendingFiles.value = Array.from(e.dataTransfer?.files || [])
}

function statusLabel(status: string) {
  return { pending: '⏳', uploading: '🔄', done: '✅', error: '❌' }[status] ?? ''
}

async function startUpload() {
  if (!pendingFiles.value.length) return
  await store.uploadFiles(pendingFiles.value, {
    storageClass: storageClass.value,
    isPublic: isPublic.value,
  })
  const allDone = store.uploadTasks.every((t) => t.status === 'done')
  if (allDone) {
    setTimeout(() => { close(); emit('done') }, 800)
  }
}
</script>
