<script setup lang="ts">
// 「관련 서비스」 — 다른 앱 계산기로 가는 링크. 「이어서 계산하기」와 같은 문법(@shakilabs/ui ShNextActions):
// 카드 전체가 링크, 제목 한 줄 + 한 줄 요약. 소개 문단·아이콘·"바로 가기" 줄은 두지 않는다(사용자 피드백
// "텍스트가 너무 많고 밋밋함"). 제목·요약은 도착 계산기가 실제로 받는 입력 기준으로 적는다.
// 다른 앱이라 href(문서 이동) — 이전과 같은 주소다.
import { ShNextActions, type NextActionItem } from "@shakilabs/ui";

const items: readonly NextActionItem[] = [
  { key: "finance-comprehensive-tax", title: "종합소득세 계산", href: "/finance/comprehensive-tax", note: "사업·임대·기타소득의 예상 세금" },
];
</script>

<template>
  <ShNextActions heading="관련 서비스" :items="items" />
</template>
