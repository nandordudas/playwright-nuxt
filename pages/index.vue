<script setup lang="ts">
definePageMeta({
  name: 'Home',
  keepalive: true,
})
</script>

<template>
  <ClientOnly>
    <PdfGenerator />
  </ClientOnly>
</template>
