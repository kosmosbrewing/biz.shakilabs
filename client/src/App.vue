<script setup lang="ts">
import AppLayout from "@/components/layout/AppLayout.vue";
import AlertHost from "@/components/ui/alert/AlertHost.vue";
</script>

<template>
  <AppLayout>
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" :key="route.path" />
    </RouterView>
    <AlertHost />
  </AppLayout>
</template>
