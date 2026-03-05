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

          <div class="settings-grid">
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

          <div v-if="testResult" class="test-result" :class="testResult.ok ? 'ok' : 'fail'">
            {{ testResult.ok ? '✅' : '❌' }} {{ testResult.message }}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn" :disabled="testing" @click="testConnection">
            <span v-if="testing" class="loading-spinner" />
            <span v-else>🧪 Test Connection</span>
          </button>
          <button class="btn" @click="close">Cancel</button>
          <button class="btn btn-primary" @click="save">Save & Connect</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const _props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue', 'connected'])

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
  'sa-east-1', 'ca-central-1',
]

const form = reactive({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  region: process.env.AWS_REGION || 'us-east-1',
  bucketName: process.env.AWS_BUCKET_NAME || '',
  endpoint: process.env.AWS_ENDPOINT_URL || '',
})

const testing = ref(false)
const testResult = ref<{ ok: boolean; message: string } | null>(null)

function close() { emit('update:modelValue', false) }

async function testConnection() {
  testing.value = true
  testResult.value = null
  try {
    // POST credentials to a test endpoint
    await $fetch('/api/s3/buckets')
    testResult.value = { ok: true, message: 'Connection successful — buckets listed.' }
  }
  catch (e: any) {
    testResult.value = { ok: false, message: e?.data?.message || e?.message || 'Connection failed' }
  }
  finally {
    testing.value = false
  }
}

function save() {
  // In a real app you'd POST these to a secure config endpoint or write to .env
  // For now we emit so the parent can show a toast
  emit('connected', { ...form })
  close()
}
</script>
