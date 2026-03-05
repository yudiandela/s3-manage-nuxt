<!-- components/RenameModal.vue -->
<template>
  <Teleport to="body">
    <div class="modal-overlay" :class="{ open: modelValue }" @click.self="close">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">✏️ Rename</div>
          <button class="modal-close" @click="close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">New Name</label>
            <input ref="inputEl" v-model="name" class="form-input" @keyup.enter="confirm" @keyup.esc="close" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="close">Cancel</button>
          <button class="btn btn-primary" :disabled="!name.trim() || loading" @click="confirm">
            <span v-if="loading" class="loading-spinner" />
            <span v-else>Rename</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useS3Store } from '~/stores/s3'
import type { S3Object } from '~/types/s3'

const props = defineProps<{ modelValue: boolean; target: S3Object | null }>()
const emit = defineEmits(['update:modelValue', 'done'])
const store = useS3Store()

const name = ref('')
const loading = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

watch(() => props.target, (t) => {
  if (t) {
    name.value = t.name
    nextTick(() => inputEl.value?.select())
  }
})

function close() { emit('update:modelValue', false) }

async function confirm() {
  if (!props.target || !name.value.trim()) return
  loading.value = true
  try {
    await store.renameObject(props.target.key, name.value.trim())
    emit('done', name.value)
    close()
  }
  finally { loading.value = false }
}
</script>
