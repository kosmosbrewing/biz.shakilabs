<script setup lang="ts">
import SEOHead from "@/components/common/SEOHead.vue";
import { RouterLink } from "vue-router";
import { buttonVariants } from "@/components/ui/button";
import { useConstantsStore } from "@/stores/constants";

const constantsStore = useConstantsStore();
</script>

<template>
  <SEOHead
    title="서비스 안내"
    description="biz.shakilabs.com은 사업자를 위한 세금·손익·수수료 계산 무료 도구입니다."
  />

  <div class="container py-5 space-y-5">
    <div class="retro-panel">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">서비스 안내</h1>
      </div>

      <div class="retro-panel-content space-y-4">
        <h2 class="text-heading font-bold">biz.shakilabs.com 소개</h2>
        <p class="text-body text-muted-foreground">
          biz.shakilabs.com은 창업·사업 운영에 필요한 세금과 수수료 계산을 빠르게 제공하는 무료 도구입니다.
          로그인 없이 바로 계산할 수 있습니다.
        </p>

        <h2 class="text-heading font-bold">주요 기능</h2>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>개인사업자 vs 법인 세후소득 비교</li>
          <li>소상공인 손익분기점(BEP) 계산</li>
          <li>간이과세 vs 일반과세 부가세 비교</li>
          <li>배달앱 수수료 비교 (배민·쿠팡이츠·요기요)</li>
        </ul>

        <h2 class="text-heading font-bold">데이터 기준</h2>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>세법 확인일: {{ constantsStore.feeDataUpdated }}</li>
          <li>소득세 6~45% 8단계, 법인세 9~24% 4단계 (2026년 기준)</li>
          <li>4대보험 요율 2026년 기준</li>
        </ul>
        <p class="text-body text-muted-foreground">
          실제 세액은 개인 상황(공제, 감면, 과세특례 등)에 따라 달라집니다.
          정확한 세무 상담은 세무사를 통해 확인하세요.
        </p>

        <h2 class="text-heading font-bold">문의</h2>
        <p class="text-body text-muted-foreground">
          오류 제보나 기능 건의는
          <a :href="`mailto:${constantsStore.supportEmail}`" class="retro-link">{{ constantsStore.supportEmail }}</a>으로
          보내주세요.
        </p>
      </div>
    </div>

    <div class="text-center">
      <RouterLink :class="buttonVariants({ variant: 'default' })" to="/">
        홈으로 돌아가기
      </RouterLink>
    </div>
  </div>
</template>
