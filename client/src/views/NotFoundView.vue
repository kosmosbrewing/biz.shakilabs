<script setup lang="ts">
import SEOHead from "@/components/common/SEOHead.vue";
import { RouterLink } from "vue-router";
import { buttonVariants } from "@/components/ui/button";
</script>

<template>
  <SEOHead
    title="페이지를 찾을 수 없습니다"
    description="biz.shakilabs.com에서 요청한 페이지를 찾을 수 없습니다."
    :noindex="true"
  />

  <div class="container py-20 text-center space-y-4">
    <p class="text-display text-muted-foreground">404</p>
    <p class="text-heading font-bold text-foreground">페이지를 찾을 수 없습니다</p>
    <p class="text-body text-muted-foreground">입력하신 주소가 잘못되었거나 페이지가 이동되었습니다.</p>
    <div class="flex flex-wrap justify-center gap-2">
      <RouterLink :class="buttonVariants({ variant: 'default' })" to="/">
        홈으로 돌아가기
      </RouterLink>
      <RouterLink :class="buttonVariants({ variant: 'outline' })" to="/delay-interest">
        지연이자 계산
      </RouterLink>
    </div>
  </div>
</template>
