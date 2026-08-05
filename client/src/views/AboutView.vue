<script setup lang="ts">
import SEOHead from "@/components/common/SEOHead.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import { BIZ_ABOUT_GUIDE, BIZ_HOME_GUIDE } from "@/data/seoGuides";
import { buttonVariants } from "@/components/ui/button";
import { useConstantsStore } from "@/stores/constants";

const constantsStore = useConstantsStore();
</script>

<template>
  <SEOHead
    title="서비스 안내"
    description="shakilabs.com/biz은 사업자를 위한 세금·손익·수수료 계산 무료 도구입니다."
  />

  <div class="container py-5 space-y-5">
    <div class="retro-panel">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">서비스 안내</h1>
      </div>

      <div class="retro-panel-content space-y-4">
        <h2 class="text-heading font-bold">shakilabs.com/biz 소개</h2>
        <p class="text-body text-muted-foreground">
          shakilabs.com/biz은 창업·사업 운영에 필요한 세금과 수수료 계산을 빠르게 제공하는 무료 도구입니다.
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
          <li>소득세 6~45% 8단계, 법인세 10~25% 4단계 (2026년 기준)</li>
          <li>4대보험 요율 2026년 기준</li>
        </ul>
        <p class="text-body text-muted-foreground">
          실제 세액은 개인 상황(공제, 감면, 과세특례 등)에 따라 달라집니다.
          정확한 세무 상담은 세무사를 통해 확인하세요.
        </p>

        <h2 class="text-heading font-bold">검증 방법</h2>
        <p class="text-body text-muted-foreground">
          모든 세율·요율은 국세청·홈택스, 고용노동부, 4대사회보험 정보연계센터 등 공공 기관이 공개한 자료를 기준으로 교차 검증합니다.
          세법이나 요율이 개정되면 확인 즉시 계산 로직에 반영하고, 각 계산기에 데이터 기준일을 함께 표기합니다.
        </p>

        <h2 class="text-heading font-bold">운영자 정보</h2>
        <p class="text-body text-muted-foreground">
          운영: ShakiLabs · 문의:
          <a :href="`mailto:${constantsStore.supportEmail}`" class="retro-link">{{ constantsStore.supportEmail }}</a>
        </p>
        <p class="text-body text-muted-foreground">
          오류 제보나 기능 건의도 같은 주소로 보내주시면 확인 후 반영합니다.
        </p>
      </div>
    </div>

    <div class="text-center">
      <a :class="buttonVariants({ variant: 'default' })" href="/biz">
        홈으로 돌아가기
      </a>
    </div>

    <SeoRichGuide
      :title="BIZ_ABOUT_GUIDE.title"
      :intro="BIZ_ABOUT_GUIDE.intro"
      :sections="BIZ_ABOUT_GUIDE.sections"
      :disclaimer="BIZ_ABOUT_GUIDE.disclaimer"
    />
    <SeoRichGuide
      :title="BIZ_HOME_GUIDE.title"
      :intro="BIZ_HOME_GUIDE.intro"
      :sections="BIZ_HOME_GUIDE.sections"
      :faqs="BIZ_HOME_GUIDE.faqs"
    />
  </div>
</template>
