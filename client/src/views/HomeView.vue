<script setup lang="ts">
import { RouterLink } from "vue-router";
import { Building2, TrendingUp, Receipt, Truck, CarFront, Calculator, HandCoins } from "lucide-vue-next";
import RelatedServices from "@/components/common/RelatedServices.vue";
import SEOHead from "@/components/common/SEOHead.vue";

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

const faqItems = [
  {
    q: "biz.shakilabs.com에서는 어떤 계산기를 제공하나요?",
    a: "개인사업자 vs 법인 비교, 손익분기점 계산, 부가세 비교, 배달앱 수수료 비교, 법인세 계산, 차량 경비와 회의비 계산까지 제공합니다.",
  },
  {
    q: "개인사업자와 법인 비교 결과는 실제 신고액과 같나요?",
    a: "아닙니다. 대표적인 세율과 비용 구조를 기준으로 단순화한 참고용 계산이며 실제 공제와 감면에 따라 달라질 수 있습니다.",
  },
  {
    q: "배달앱 수수료 비교는 어떤 상황에서 유용한가요?",
    a: "플랫폼별 수수료 차이로 같은 매출에서도 남는 금액이 어떻게 달라지는지 빠르게 가늠할 때 유용합니다.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};
</script>

<template>
  <SEOHead
    title="사업자 계산기 — 개인vs법인·손익분기·부가세·배달앱 수수료"
    description="개인사업자 vs 법인 세후소득, 손익분기점, 간이과세 vs 일반과세, 배달앱 수수료를 무료로 계산하세요."
    :json-ld="faqJsonLd"
  />

  <div class="container py-8 sm:py-12">
    <section class="text-center mb-10">
      <h1 class="text-display sm:text-[2rem] font-bold text-foreground mb-3">
        사업자 계산기
      </h1>
      <p class="text-body text-muted-foreground max-w-xl mx-auto">
        창업 준비부터 운영까지, 사업에 필요한 세금·손익·수수료를 빠르게 계산하세요.
      </p>
    </section>

    <div class="grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
      <RouterLink
        v-for="tool in tools"
        :key="tool.to"
        :to="tool.to"
        class="group retro-panel p-5 sm:p-6 flex gap-4 items-start hover:border-primary/40 transition-colors"
      >
        <span class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
          <component :is="tool.icon" class="h-5 w-5" />
        </span>
        <div class="min-w-0">
          <h2 class="text-heading font-semibold text-foreground group-hover:text-primary transition-colors">
            {{ tool.title }}
          </h2>
          <p class="mt-1 text-caption text-muted-foreground">
            {{ tool.desc }}
          </p>
        </div>
      </RouterLink>
    </div>

    <section class="mt-12 max-w-3xl mx-auto">
      <div class="retro-panel p-5">
        <h2 class="text-heading font-semibold text-foreground mb-3">안내사항</h2>
        <ul class="space-y-1.5 text-caption text-muted-foreground list-disc pl-4">
          <li>2026년 세법 기준으로 계산합니다.</li>
          <li>실제 세액은 개인 상황(공제, 감면 등)에 따라 달라질 수 있습니다.</li>
          <li>법적 효력이 없는 참고용 계산입니다. 정확한 세무는 세무사 상담을 권장합니다.</li>
        </ul>
      </div>
    </section>

    <section class="mt-6 max-w-3xl mx-auto">
      <div class="retro-panel overflow-hidden">
        <div class="retro-titlebar rounded-t-2xl">
          <h2 class="retro-title">자주 묻는 질문</h2>
        </div>
        <div class="retro-panel-content space-y-3">
          <details
            v-for="faq in faqItems"
            :key="faq.q"
            class="retro-panel-muted p-4"
          >
            <summary class="cursor-pointer list-none text-body font-semibold text-foreground">
              {{ faq.q }}
            </summary>
            <p class="mt-2 text-caption leading-relaxed text-muted-foreground">
              {{ faq.a }}
            </p>
          </details>
        </div>
      </div>
    </section>

    <section class="mt-6 max-w-3xl mx-auto">
      <RelatedServices />
    </section>
  </div>
</template>
