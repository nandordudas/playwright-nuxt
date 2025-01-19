<script lang="ts">
import { consola } from 'consola'

type ProcessState = 'pending' | 'running' | 'completed' | 'error'

// [WARN] Must be on client-side, use `ClientOnly` for server-side.
const createObjectURL = window.URL.createObjectURL.bind(window.URL)
const revokeObjectURL = window.URL.revokeObjectURL.bind(window.URL)
const createElement = document.createElement.bind(document)

async function generatePdf(htmlContent: string) {
  const { promise, resolve, reject } = Promise.withResolvers<void>()

  try {
    const response = await $fetch.raw('/api/generate-pdf', {
      method: 'post',
      body: { html: htmlContent },
      responseType: 'blob',
      signal: AbortSignal.timeout(3_000),
    })

    const contentDisposition = response.headers.get('Content-Disposition')

    if (!contentDisposition)
      throw new Error('Content-Disposition header not found')

    const a = createElement('a')
    const url = createObjectURL(response._data as unknown as Blob)
    const filename = contentDisposition.split('filename=')[1].replace(/"/g, '')

    a.href = url
    a.download = filename

    a.click()
    revokeObjectURL(url)
    a.remove()
    resolve()

    return promise
  }
  catch (error) {
    consola.error('Error generating PDF:', error)
    reject(error instanceof Error ? error : new Error('Unknown error'))
  }

  return promise
}

const html = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw({ raw: strings }, ...values)

interface HTMLOptions {
  debug: boolean
}

function htmlContent({ debug }: HTMLOptions) {
  return html`<!doctype html>
  <html lang="en-US" ${debug ? 'data-debug' : ''}>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@100;400&display=swap');

        /* Add local() to use locally installed fonts if available */
        @font-face {
          font-family: 'Maple Mono';
          font-style: normal;
          font-display: swap;
          font-weight: 400;
          src: url(https://cdn.jsdelivr.net/fontsource/fonts/maple-mono@latest/latin-400-normal.woff2) format('woff2'), url(https://cdn.jsdelivr.net/fontsource/fonts/maple-mono@latest/latin-400-normal.woff) format('woff');
        }

        [data-debug],
        [data-debug] * {
          outline: 1px dashed tomato;
          outline-offset: -1px;
        }

        body {
          font-family: "Poppins", serif;
          font-weight: 100;
          font-style: normal;
        }

        h1 {
          color: #333;
        }

        code {
          font-family: 'Maple Mono', monospace;
        }
      </style>
    </head>
    <body>
      <h1>Your Title 🥷🇭🇺</h1>
      <p>Your content here...</p>
      <img src="https://playwright.dev/img/playwright-logo.svg" alt="Playwright Logo">
      <br>
      <code>const url = window.URL.createObjectURL(response._data as unknown as Blob)</code>
    </body>
  </html>`
}
</script>

<script setup lang="ts">
const state = ref<ProcessState>('pending')
const debug = ref<boolean>(false)

const isRunning = computed(() => state.value === 'running')
const isCompleted = computed(() => state.value === 'completed')
const isError = computed(() => state.value === 'error')
const memoizedHtmlContent = computed(() => htmlContent({ debug: debug.value }))

async function handleSubmit() {
  try {
    state.value = 'running'

    await generatePdf(memoizedHtmlContent.value)

    state.value = 'completed'
  }
  catch (error) {
    state.value = 'error'
  }
}

onMounted(async () => {
  await nextTick()
  consola.ready('mounted')
})
</script>

<template>
  <form
    :inert="isRunning"
    :aria-busy="isRunning"
    @submit.prevent="handleSubmit"
  >
    <fieldset>
      <legend>CSS Debug</legend>
      <input id="debug" v-model="debug" type="checkbox" :disabled="isRunning" name="debug">
      <label for="debug">Enable CSS Debug</label>
    </fieldset>

    <fieldset>
      <legend>PDF</legend>
      <button type="submit" :disabled="isRunning">
        Generate PDF
      </button>
    </fieldset>
  </form>

  <div role="status" aria-live="polite">
    <Transition name="fade" mode="out-in">
      <div v-if="isRunning">
        Generating PDF...
      </div>

      <div v-else-if="isCompleted">
        PDF generated successfully!
      </div>

      <div v-else-if="isError">
        Error generating PDF.
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
</style>
