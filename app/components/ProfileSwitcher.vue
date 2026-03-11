<template>
  <select class="btn" style="cursor:pointer" :value="value" :disabled="loading" @change="onChange">
    <option value="__env">Default (env)</option>
    <option v-for="p in store.profiles" :key="p.id" :value="p.id">
      {{ label(p) }}
    </option>
  </select>
</template>

<script setup lang="ts">
import type { S3ProfilePublic } from '~/types/config'
import { useS3Store } from '~/stores/s3'
import { useToast } from '~/composables/useToast'

const store = useS3Store()
const toast = useToast()
const loading = ref(false)

const value = computed(() => store.activeProfileId || '__env')

onMounted(async () => {
  loading.value = true
  try {
    await store.fetchProfiles()
  }
  finally {
    loading.value = false
  }
})

function label(p: S3ProfilePublic) {
  const endpoint = p.endpoint ? safeHost(p.endpoint) : null
  const bits = [p.name]
  if (endpoint) bits.push(endpoint)
  return bits.join(' · ')
}

function safeHost(u: string) {
  try { return new URL(u).host } catch { return u }
}

async function onChange(e: Event) {
  const id = (e.target as HTMLSelectElement).value
  loading.value = true
  try {
    await store.switchProfile(id === '__env' ? null : id)
    toast.success('Switched profile')
  }
  catch (err: any) {
    toast.error(err?.data?.message || err?.message || 'Failed to switch profile')
  }
  finally {
    loading.value = false
  }
}
</script>
