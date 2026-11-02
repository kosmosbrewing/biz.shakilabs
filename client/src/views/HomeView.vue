<script setup lang="ts">
import { RouterLink } from "vue-router";
import { Building2, TrendingUp, Receipt, Truck, CarFront, Calculator, HandCoins, ArrowRight } from "lucide-vue-next";
import { ShText } from "@shakilabs/ui";
import { ActionCard } from "@/components/ui/action-card";
import RelatedServices from "@/components/common/RelatedServices.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import { APP_NAME } from "@/composables/useSEO";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import { BIZ_HOME_GUIDE, type GuideData } from "@/data/seoGuides";
import { withDigest } from "@/data/digests";
import { HOME_DIGEST } from "@/data/digests/homeDigest";

const tools = [
  {
    title: "개인 vs 법인",
    desc: "동일 매출 대비 개인사업자와 법인의 세후소득을 비교합니다.",
    to: "/individual-vs-corp",
    icon: Building2,
  },
  {
    title: "손익분기점",
    desc: "고정비·변동비를 입력하면 월 매출 BEP를 계산합니다.",
    to: "/break-even",
    icon: TrendingUp,
  },
  {
    title: "부가세 비교",
    desc: "간이과세와 일반과세, 어느 쪽이 부가세가 적은지 비교합니다.",
    to: "/vat-compare",
    icon: Receipt,
  },
  {
    title: "배달앱 수수료",
    desc: "배민·쿠팡이츠·요기요 수수료를 한눈에 비교합니다.",
    to: "/delivery-fee",
    icon: Truck,
  },
  {
    title: "법인세 계산",
    desc: "과세표준 기준 예상 법인세와 실효세율을 빠르게 계산합니다.",
    to: "/corp-tax",
    icon: Calculator,
  },
  {
    title: "업무용 차량 경비",
    desc: "업무 사용비율에 따라 차량비 손금 인정액을 계산합니다.",
    to: "/car-expense",
    icon: CarFront,
  },
  {
    title: "회의 비용 계산",
    desc: "회의 인원과 빈도를 기준으로 연간 예산을 계산합니다.",
    to: "/meeting-cost",
    icon: HandCoins,
  },
] as const;

// 허브 가이드는 엔진 파생 다이제스트만 싣는다. 일반 절 5개("개인사업자 vs 법인 선택 기준" 등)·허브 FAQ 8문항·
// "안내사항" 카드는 2026-11 UI 감사에서 뺐다(GA4 28일 허브 조회 8) — 각 계산기 페이지가 같은 내용을 더 정확히 다룬다.
// BIZ_HOME_GUIDE는 다섯 도구 뷰·/about이 공유하므로 데이터는 그대로 두고, 허브용 사본에서 일반 절만 비운다.
const BIZ_HUB_GUIDE: GuideData = { ...BIZ_HOME_GUIDE, sections: [] };
const guideSections = withDigest(BIZ_HUB_GUIDE, HOME_DIGEST);
</script>

<template>
  <!-- 함대 제목 레시피(2026-10-03): 홈은 `<앱 이름> | ShakiLabs` (useSEO.buildPageTitle) -->
  <SEOHead
    :title="APP_NAME"
    description="개인사업자 vs 법인 세후소득, 손익분기점, 간이과세 vs 일반과세, 배달앱 수수료를 무료로 계산하세요."
  />

  <div class="sh-container sh-container--page py-8 sm:py-12">
    <section class="mx-auto mb-10 border-b border-border pb-6">
      <ShText as="h1" variant="display">사업자 계산기</ShText>
      <ShText class="mt-2 max-w-xl" variant="body" tone="muted">
        창업 준비부터 운영까지, 사업에 필요한 세금·손익·수수료를 빠르게 계산하세요.
      </ShText>
    </section>

    <div class="mx-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ActionCard
        v-for="tool in tools"
        :key="tool.to"
        as-child
      >
        <RouterLink :to="tool.to" class="flex gap-4 items-start">
          <span class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            <component :is="tool.icon" class="h-5 w-5" />
          </span>
          <div class="min-w-0">
            <h2 class="text-heading font-semibold text-foreground group-hover:text-primary transition-colors">
              {{ tool.title }}
            </h2>
            <p class="mt-1 text-caption text-muted-foreground">
              {{ tool.desc }}
            </p>
            <p class="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-primary">
              계산하기
              <ArrowRight class="h-3.5 w-3.5" />
            </p>
          </div>
        </RouterLink>
      </ActionCard>
    </div>

    <section class="mt-6 mx-auto">
      <RelatedServices />
    </section>

    <section class="mt-6 mx-auto">
      <SeoRichGuide
        :title="BIZ_HOME_GUIDE.title"
        :intro="BIZ_HOME_GUIDE.intro"
        :sections="guideSections"        :disclaimer="BIZ_HOME_GUIDE.disclaimer"
      />
    </section>
  </div>
</template>
