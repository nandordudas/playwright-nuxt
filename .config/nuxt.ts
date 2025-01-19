// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  experimental: { typedPages: true },
  router: { options: { strict: true } },
  future: { compatibilityVersion: 4 },
})
