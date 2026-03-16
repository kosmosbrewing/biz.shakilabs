<script setup lang="ts">
import SEOHead from "@/components/common/SEOHead.vue";
import { useConstantsStore } from "@/stores/constants";

const constantsStore = useConstantsStore();
</script>

<template>
  <SEOHead title="개인정보 처리방침" description="biz.shakilabs.com의 개인정보 처리방침입니다." />

  <div class="container py-5">
    <div class="retro-panel">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">개인정보 처리방침</h1>
      </div>

      <div class="retro-panel-content space-y-4">
        <p class="text-body text-muted-foreground">
          biz.shakilabs.com(이하 "본 서비스")은 이용자의 개인정보를 중요하게 생각하며,
          다음과 같이 개인정보를 처리합니다.
        </p>

        <h2 class="text-heading font-bold">1. 수집하는 개인정보</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 회원가입 기능이 없으며 별도의 개인정보를 수집하지 않습니다.
          계산 결과는 브라우저에서만 처리되며 서버에 저장되지 않습니다.
        </p>

        <h2 class="text-heading font-bold">2. 쿠키 및 분석 도구</h2>
        <p class="text-body text-muted-foreground">
          서비스 개선을 위해 Google Analytics를 사용할 수 있으며, 이를 통해 방문 페이지, 체류 시간 등
          비식별 데이터가 수집될 수 있습니다.
        </p>

        <h2 class="text-heading font-bold">3. 광고 및 제3자 제공</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 Google AdSense를 통해 광고를 게재할 수 있으며, 이 과정에서 쿠키가 사용될 수 있습니다.
          본 서비스는 위 분석·광고 목적 외에 이용자의 데이터를 제3자에게 제공하지 않습니다.
        </p>

        <h2 class="text-heading font-bold">4. 이용자의 권리</h2>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>브라우저 설정에서 쿠키를 차단하거나 삭제할 수 있습니다.</li>
          <li>Google Analytics 수집을 원하지 않는 경우 차단 브라우저 부가기능을 사용할 수 있습니다.</li>
          <li>개인정보 관련 문의는 아래 연락처로 접수할 수 있습니다.</li>
        </ul>

        <h2 class="text-heading font-bold">5. 문의</h2>
        <p class="text-body text-muted-foreground">
          개인정보 관련 문의:
          <a :href="`mailto:${constantsStore.supportEmail}`" class="retro-link">
            {{ constantsStore.supportEmail }}
          </a>
        </p>

        <p class="text-tiny text-muted-foreground mt-6">시행일: 2026년 3월 15일</p>
      </div>
    </div>
  </div>
</template>
