// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    awsRegion: process.env.NUXT_DEFAULT_REGION,
    awsAccessKeyId: process.env.NUXT_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.NUXT_SECRET_ACCESS_KEY,
    awsEndpoint: process.env.NUXT_ENDPOINT,
  },
})
