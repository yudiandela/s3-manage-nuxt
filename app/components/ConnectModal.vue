<!-- components/ConnectModal.vue -->
<template>
  <Teleport to="body">
    <div class="modal-overlay" :class="{ open: modelValue }" @click.self="close">
      <div class="modal" style="width: 540px">
        <div class="modal-header">
          <div class="modal-title">🔗 Connect S3 Bucket</div>
          <button class="modal-close" @click="close">✕</button>
        </div>

        <div class="modal-body">
          <div class="info-banner">
            💡 Configure AWS credentials to connect to S3 or any compatible storage (MinIO, Cloudflare R2, DigitalOcean
            Spaces, Backblaze B2…). Credentials are stored server-side only.
          </div>

          <div class="form-group">
            <label class="form-label">Profile</label>
            <select v-model="selectedProfileId" class="form-input" :disabled="loadingProfiles"
              @change="onProfileChange">
              <option value="__env">Default (env)</option>
              <option v-for="p in profiles" :key="p.id" :value="p.id">
                {{ p.name }}{{ p.accessKeyIdMasked ? ` (${p.accessKeyIdMasked})` : '' }}
              </option>
            </select>
          </div>

          <div class="settings-grid">
            <div class="form-group">
              <label class="form-label">Profile Name</label>
              <input v-model="profileName" class="form-input" placeholder="Production / Staging / MinIO" />
            </div>
            <div class="form-group">
              <label class="form-label">Access Key ID</label>
              <input v-model="form.accessKeyId" class="form-input" placeholder="AKIA…" type="password"
                autocomplete="off" />
            </div>
            <div class="form-group">
              <label class="form-label">Secret Access Key</label>
              <input v-model="form.secretAccessKey" class="form-input" placeholder="••••••••••••••••" type="password"
                autocomplete="off" />
            </div>
            <div class="form-group">
              <label class="form-label">Region</label>
              <select v-model="form.region" class="form-input">
                <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Default Bucket (optional)</label>
              <input v-model="form.bucketName" class="form-input" placeholder="my-bucket-name" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Custom Endpoint URL (S3-compatible only)</label>
            <input v-model="form.endpoint" class="form-input" placeholder="https://s3.example.com" />
          </div>

          <div class="form-group">
            <button class="btn" style="width:100%" @click="applyR2Example">
              Use Cloudflare R2 example
            </button>
          </div>

          <div v-if="testResult" class="test-result" :class="testResult.ok ? 'ok' : 'fail'">
            {{ testResult.ok ? '✅' : '❌' }} {{ testResult.message }}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn" :disabled="testing" @click="testConnection">
            <span v-if="testing" class="loading-spinner" />
            <span v-else>🧪 Test Connection</span>
          </button>
          <button v-if="selectedProfileId !== '__env'" class="btn btn-danger" :disabled="testing || loadingProfiles"
            @click="removeProfile">
            🗑️ Delete Profile
          </button>
          <button class="btn" @click="close">Cancel</button>
          <button class="btn btn-primary" @click="save">Save & Connect</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { S3ProfilePublic } from '~/types/config'

const _props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue', 'connected'])

const regions = [
  'auto',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
  'sa-east-1', 'ca-central-1',
]

const form = reactive({
  accessKeyId: '',
  secretAccessKey: '',
  region: 'us-east-1',
  bucketName: '',
  endpoint: '',
})

const profiles = ref<S3ProfilePublic[]>([])
const selectedProfileId = ref<string>('__env')
const profileName = ref<string>('')
const loadingProfiles = ref(false)

const testing = ref(false)
const testResult = ref<{ ok: boolean; message: string } | null>(null)

watch(() => _props.modelValue, async (v) => {
  if (v) await refreshProfiles()
})

function close() { emit('update:modelValue', false) }

async function refreshProfiles() {
  loadingProfiles.value = true
  try {
    const data = await $fetch('/api/config/profiles')
    profiles.value = data.profiles || []
    selectedProfileId.value = data.activeProfileId || '__env'
    applySelectedProfile()
  }
  finally {
    loadingProfiles.value = false
  }
}

function applySelectedProfile() {
  const p = profiles.value.find(x => x.id === selectedProfileId.value)
  profileName.value = p?.name || ''
  form.region = p?.region || 'us-east-1'
  form.bucketName = p?.defaultBucket || ''
  form.endpoint = p?.endpoint || ''
  form.accessKeyId = ''
  form.secretAccessKey = ''
}

function onProfileChange() {
  applySelectedProfile()
}

function applyR2Example() {
  selectedProfileId.value = '__env'
  profileName.value = 'Cloudflare R2'
  form.region = 'auto'
  form.endpoint = 'https://dafbcc9bb54eab3add9d1b755668cd27.r2.cloudflarestorage.com'
  form.bucketName = ''
  form.accessKeyId = ''
  form.secretAccessKey = ''
}

async function testConnection() {
  testing.value = true
  testResult.value = null
  try {
    const r = await $fetch('/api/config/test', {
      method: 'POST',
      body: {
        region: form.region,
        endpoint: form.endpoint || undefined,
        accessKeyId: form.accessKeyId,
        secretAccessKey: form.secretAccessKey,
      },
    })
    const count = (r.buckets || []).length
    testResult.value = { ok: true, message: `Connection successful — ${count} bucket(s) listed.` }
  }
  catch (e: any) {
    testResult.value = { ok: false, message: e?.data?.message || e?.message || 'Connection failed' }
  }
  finally {
    testing.value = false
  }
}

async function removeProfile() {
  const id = selectedProfileId.value
  if (id === '__env') return
  await $fetch('/api/config/profiles', { method: 'DELETE', body: { id } })
  await refreshProfiles()
}

async function save() {
  if (selectedProfileId.value === '__env') {
    if (form.accessKeyId && form.secretAccessKey && profileName.value.trim()) {
      await $fetch('/api/config/profiles', {
        method: 'POST',
        body: {
          name: profileName.value.trim(),
          region: form.region,
          endpoint: form.endpoint || undefined,
          defaultBucket: form.bucketName || undefined,
          accessKeyId: form.accessKeyId,
          secretAccessKey: form.secretAccessKey,
          setActive: true,
        },
      })
    }
    else {
      await $fetch('/api/config/active', { method: 'POST', body: { id: null } })
    }
    emit('connected', {})
    close()
    return
  }

  const p = profiles.value.find(x => x.id === selectedProfileId.value)
  const isDirty = Boolean(
    form.accessKeyId
    || form.secretAccessKey
    || profileName.value.trim() !== (p?.name || '')
    || form.region !== (p?.region || 'us-east-1')
    || (form.bucketName || '') !== (p?.defaultBucket || '')
    || (form.endpoint || '') !== (p?.endpoint || ''),
  )

  if (!isDirty) {
    await $fetch('/api/config/active', { method: 'POST', body: { id: selectedProfileId.value } })
    emit('connected', {})
    close()
    return
  }

  await $fetch('/api/config/profiles', {
    method: 'POST',
    body: {
      id: selectedProfileId.value,
      name: profileName.value.trim() || p?.name || 'Profile',
      region: form.region,
      endpoint: form.endpoint || undefined,
      defaultBucket: form.bucketName || undefined,
      accessKeyId: form.accessKeyId || undefined,
      secretAccessKey: form.secretAccessKey || undefined,
      setActive: true,
    },
  })

  emit('connected', {})
  close()
}
</script>
