<script setup lang="ts">
/**
 * SEO 리치 가이드 섹션 컴포넌트
 * 각 계산기 뷰 하단에 도메인 가이드 + FAQ + 체크리스트를 출력하여
 * vite-ssg SSR 시 HTML에 실제 텍스트가 반영되도록 한다.
 */
export interface GuideSection {
  h2: string;
  body: string;
}

export interface GuideFaq {
  q: string;
  a: string;
}

export interface GuideChecklist {
  title: string;
  items: string[];
}

defineProps<{
  title: string;
  intro: string;
  sections?: GuideSection[];
  faqs?: GuideFaq[];
  checklist?: GuideChecklist;
  disclaimer?: string;
}>();
</script>

<template>
  <section class="seo-rich-guide space-y-4 rounded-lg border border-border/40 bg-muted/10 p-4 md:p-6">
    <header class="space-y-2">
      <h2 class="text-xl font-bold text-foreground">{{ title }}</h2>
      <p class="text-sm leading-relaxed text-muted-foreground">{{ intro }}</p>
    </header>

    <div v-if="sections && sections.length > 0" class="space-y-4">
      <article
        v-for="(s, i) in sections"
        :key="`sec-${i}`"
        class="space-y-2"
      >
        <h3 class="text-base font-semibold text-foreground">{{ s.h2 }}</h3>
        <p class="text-sm leading-relaxed text-muted-foreground">{{ s.body }}</p>
      </article>
    </div>

    <div v-if="checklist && checklist.items.length > 0" class="space-y-2">
      <h3 class="text-base font-semibold text-foreground">{{ checklist.title }}</h3>
      <ul class="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
        <li v-for="(item, i) in checklist.items" :key="`chk-${i}`">
          {{ item }}
        </li>
      </ul>
    </div>

    <div v-if="faqs && faqs.length > 0" class="space-y-3">
      <h3 class="text-base font-semibold text-foreground">자주 묻는 질문 (FAQ)</h3>
      <div
        v-for="(faq, i) in faqs"
        :key="`faq-${i}`"
        class="space-y-1"
      >
        <p class="text-sm font-semibold text-foreground">Q. {{ faq.q }}</p>
        <p class="text-sm leading-relaxed text-muted-foreground">A. {{ faq.a }}</p>
      </div>
    </div>

    <p
      v-if="disclaimer"
      class="border-t border-border/40 pt-3 text-xs text-muted-foreground"
    >
      {{ disclaimer }}
    </p>
  </section>
</template>
