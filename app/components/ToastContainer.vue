<!-- components/ToastContainer.vue -->
<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
          <span class="toast-icon">{{ icons[toast.type] }}</span>
          <span>{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast'
const { toasts } = useToast()

const icons: Record<string, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warn: '⚠️',
}
</script>
