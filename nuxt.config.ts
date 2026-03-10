// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    awsRegion: process.env.NUXT_S3_DEFAULT_REGION,
    awsAccessKeyId: process.env.NUXT_S3_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.NUXT_S3_SECRET_ACCESS_KEY,
    awsEndpoint: process.env.NUXT_S3_ENDPOINT,
    public: {
      s3Endpoint: process.env.NUXT_S3_ENDPOINT,
    },
  },
})
