<script setup lang="ts">
import { ShSurface } from "@shakilabs/ui";
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
import BizTabNavigation from "@/components/biz/BizTabNavigation.vue";
</script>

<template>
  <!-- v3 AppShell: ShGlobalHeader가 자체 SkipLink를 렌더하므로 여기서 중복으로 만들지 않는다. -->
  <ShSurface
    as="div"
    variant="plain"
    padding="none"
    class="design-system-shell min-h-screen flex flex-col bg-background"
  >
    <AppHeader />
    <BizTabNavigation />
    <main id="main-content" tabindex="-1" class="flex-1 relative">
      <slot />
    </main>
    <AppFooter />
  </ShSurface>
</template>
