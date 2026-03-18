<script setup lang="ts">
import AppLayout from "@/components/layout/AppLayout.vue";
import AlertHost from "@/components/ui/alert/AlertHost.vue";
import LoadingSpinner from "@/components/ui/loading/LoadingSpinner.vue";
</script>

<template>
  <AppLayout>
    <RouterView v-slot="{ Component, route }">
      <Transition name="page-fade" mode="out-in">
        <Suspense :key="route.path" timeout="0">
          <component :is="Component" />
          <template #fallback>
            <div class="container py-10">
              <LoadingSpinner
                variant="spinner"
                message="화면을 불러오는 중입니다."
              />
            </div>
          </template>
        </Suspense>
      </Transition>
    </RouterView>
    <AlertHost />
  </AppLayout>
</template>
