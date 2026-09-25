<script setup lang="ts">
// v3 §3.2 — 헤더는 로고 / 앱 이름 + 사이트 링크 + 테마 토글 + ☰.
// 0.3.38 "순수 내비게이션"(2026-09-25): 가운데 회전 안내(티커)는 정보라 뺐다.
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { ShGlobalHeader, ShThemeToggle, type GlobalHeaderLink } from "@shakilabs/ui";
import { BIZ_TOOLS } from "@/data/bizNavigation";

// 사이트 링크 — 블로그는 포털 소유라 href, 소개는 이 앱 라우트라 RouterLink(to). 모바일에서는 ☰ 안으로 들어간다.
const links: GlobalHeaderLink[] = [
  { href: "/blog", label: "블로그" },
  { to: "/about", label: "소개" },
];

// 모바일 전체 메뉴(☰)에 실을 도구 목록 — 2차 내비(BizTabNavigation)와 같은 출처를 쓴다.
// RouterLink를 넘겨야 메뉴 링크가 /biz 기준 경로가 된다 — 빠져 있던 동안 라이브 모바일
// 메뉴가 /break-even처럼 포털 루트로 나갔다(2026-09-25 실측).
const route = useRoute();
const navItems = BIZ_TOOLS;
const navActiveKey = computed(
  () => navItems.find((item) => route.path === item.to)?.key ?? "",
);
</script>

<template>
  <ShGlobalHeader
    app="biz"
    :links="links"
    home-href="/"
    brand="ShakiLabs"
    :nav-items="navItems"
    :nav-active-key="navActiveKey"
    :link-component="RouterLink"
  >
    <template #utility>
      <ShThemeToggle storage-key="shakilabs:theme:v1" />
    </template>
  </ShGlobalHeader>
</template>
