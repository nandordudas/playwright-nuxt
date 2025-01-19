<script lang="ts">
import type { NuxtError } from '#app'

export interface Props {
  error: NuxtError
}
</script>

<script setup lang="ts">
defineProps<Props>()

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div>
    <h2>{{ error.statusCode }}</h2>
    <button @click="handleError">
      Clear errors
    </button>
  </div>
</template>
