<script setup lang="ts">
import { RouterLink } from "vue-router";
import { Building2, TrendingUp, Receipt, Truck } from "lucide-vue-next";
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
] as const;
</script>

<template>
  <SEOHead
    title="사업자 계산기 — 개인vs법인·손익분기·부가세·배달앱 수수료"
    description="개인사업자 vs 법인 세후소득, 손익분기점, 간이과세 vs 일반과세, 배달앱 수수료를 무료로 계산하세요."
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
  </div>
</template>
