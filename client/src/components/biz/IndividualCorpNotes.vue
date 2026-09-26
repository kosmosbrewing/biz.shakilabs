<script setup lang="ts">
// 짝(ShPairRow) 우측 칸에 다음 계산 카드와 함께 쌓이는 유의사항 패널만 담당한다.
// FAQ 아코디언은 전폭 유지 대상이라 IndividualVsCorpView에서 별도로 렌더한다(2026-09-25 데이터 블록 2열화).
import { AlertCircle } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
</script>

<template>
  <Card class="border-border/60">
    <CardContent class="biz-note-panel p-4">
      <div class="mb-2 flex items-center gap-2">
        <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <AlertCircle class="h-3.5 w-3.5" />
        </span>
        <p class="text-tiny font-semibold text-foreground">유의사항</p>
      </div>
      <ul class="list-disc space-y-0.5 pl-4 text-tiny text-muted-foreground">
        <li>개인사업자는 종합소득세, 법인은 법인세와 배당소득세 구조입니다.</li>
        <li>보험료는 개인이 과세소득 전체에 국민연금·건강보험 전액(지역가입자), 법인은 대표 급여에만 회사 몫과 대표 몫을 합쳐 넣습니다. 대표이사는 고용·산재보험 의무 가입 대상이 아니며, 배당에 붙는 건강보험료는 반영하지 않습니다.</li>
        <li>배당소득세는 배당 전액에 15.4%(분리과세)를 적용합니다. 이자·배당이 연 2,000만원을 넘으면 넘는 부분은 다른 소득과 합산해 종합과세되므로, 배당이 큰 경우 법인 쪽 세후가 실제보다 크게 나옵니다.</li>
        <li>법인 설립비·기장료 등 간접비용과 추가 공제·감면은 별도입니다.</li>
      </ul>
    </CardContent>
  </Card>
</template>
