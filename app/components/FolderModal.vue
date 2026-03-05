<!-- components/FolderModal.vue -->
<template>
  <Teleport to="body">
    <div class="modal-overlay" :class="{ open: modelValue }" @click.self="close">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">📁 Create Folder</div>
          <button class="modal-close" @click="close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Folder Name</label>
            <input ref="inputEl" v-model="folderName" class="form-input" placeholder="my-folder" @keyup.enter="create"
              @keyup.esc="close" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="close">Cancel</button>
          <button class="btn btn-primary" :disabled="!folderName.trim() || loading" @click="create">
            <span v-if="loading" class="loading-spinner" />
            <span v-else>Create</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useS3Store } from '~/stores/s3'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue', 'done'])
const store = useS3Store()

const folderName = ref('')
const loading = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

watch(() => props.modelValue, (v) => {
  if (v) nextTick(() => inputEl.value?.focus())
})

function close() {
  folderName.value = ''
  emit('update:modelValue', false)
}

async function create() {
  if (!folderName.value.trim()) return
  loading.value = true
  try {
    await store.createFolder(folderName.value.trim())
    emit('done')
    close()
  }
  finally { loading.value = false }
}
</script>
