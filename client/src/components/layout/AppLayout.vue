<script setup lang="ts">
import { ShSurface } from "@shakilabs/ui";
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
import TabNavigation from "@/components/common/TabNavigation.vue";
</script>

<template>
  <ShSurface
    as="div"
    variant="plain"
    padding="none"
    class="design-system-shell min-h-screen flex flex-col bg-background"
  >
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded focus:bg-background focus:px-3 focus:py-2 focus:text-caption focus:font-semibold"
    >
      본문 바로가기
    </a>
    <AppHeader />
    <TabNavigation />
    <main id="main-content" tabindex="-1" class="flex-1 relative">
      <slot />
    </main>
    <AppFooter />
  </ShSurface>
</template>
