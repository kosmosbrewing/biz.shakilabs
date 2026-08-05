<script setup lang="ts">
import SEOHead from "@/components/common/SEOHead.vue";
import { useConstantsStore } from "@/stores/constants";

const constantsStore = useConstantsStore();
</script>

<template>
  <SEOHead title="개인정보 처리방침" description="shakilabs.com/biz의 개인정보 처리방침입니다. 수집 정보, 쿠키, 광고, 이용자 권리를 안내합니다." />

  <div class="container py-5">
    <div class="retro-panel">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">개인정보 처리방침</h1>
      </div>

      <div class="retro-panel-content space-y-4">
        <p class="text-body text-muted-foreground">
          shakilabs.com/biz(이하 "본 서비스")은 이용자의 개인정보를 소중히 여기며, 관련 법령을 준수합니다.
          본 방침은 본 서비스가 어떤 정보를 어떻게 처리하는지, 이용자가 어떤 권리를 어떻게 행사할 수 있는지를 안내합니다.
        </p>

        <h2 class="text-heading font-bold">1. 수집하는 정보와 처리 방식</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 회원가입, 로그인 기능이 없으며 이름, 연락처, 주민등록번호, 사업자등록번호 등
          개인·사업자 식별 정보를 직접 수집하지 않습니다.
          이용자가 계산기에 입력하는 매출액, 비용, 직원 월급, 세율 조건 등의 사업 관련 수치는
          전부 이용자의 브라우저(기기) 안에서만 계산되며, 운영자 서버로 전송되거나 저장되지 않습니다.
          일부 계산기는 계산 조건이 주소(URL)에 포함된 링크를 제공하는데, 이 링크 역시
          이용자가 직접 전달하기 전까지는 어디에도 저장되지 않습니다.
          화면 테마(다크 모드) 설정처럼 편의를 위한 값은 브라우저의 로컬 저장소에만 보관됩니다.
        </p>

        <h2 class="text-heading font-bold">2. 쿠키 및 유사 기술</h2>
        <p class="text-body text-muted-foreground">
          쿠키는 웹사이트가 이용자의 브라우저에 저장하는 작은 텍스트 파일입니다.
          본 서비스 자체는 필수 쿠키를 거의 사용하지 않지만, 아래의 웹 분석 도구와 광고 플랫폼이
          서비스 개선과 광고 게재를 위해 쿠키를 사용할 수 있습니다.
          이용자는 브라우저 설정에서 쿠키 저장을 거부하거나 저장된 쿠키를 삭제할 수 있으며,
          쿠키를 차단해도 계산기 이용에는 제한이 없습니다.
        </p>

        <h2 class="text-heading font-bold">3. 웹 분석 도구 (Google Analytics)</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 서비스 개선을 위해 Google Analytics를 사용할 수 있습니다.
          이 과정에서 방문 페이지, 체류 시간, 유입 경로, 브라우저 종류 등 개인을 식별할 수 없는
          통계 정보가 수집될 수 있으며, 수집된 정보는 이용 패턴 분석과 기능 개선 목적에만 사용됩니다.
        </p>

        <h2 class="text-heading font-bold">4. 광고 게재 및 제3자 광고 쿠키 (Google AdSense)</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 무료 운영을 위해 Google AdSense를 통한 광고를 게재합니다. 광고 게재와 관련해 다음 사항을 알려드립니다.
        </p>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>Google을 포함한 제3자 광고 사업자는 쿠키를 사용하여 이용자의 본 서비스 또는 다른 웹사이트 방문 기록을 기반으로 광고를 게재합니다.</li>
          <li>Google은 광고 쿠키를 사용하여 이용자의 관심사에 맞춘 맞춤 광고를 표시할 수 있습니다.</li>
          <li>
            이용자는
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" class="retro-link">Google 광고 설정</a>에서
            맞춤 광고를 해제할 수 있으며,
            <a href="https://www.aboutads.info/choices" target="_blank" rel="noopener noreferrer" class="retro-link">www.aboutads.info/choices</a>를
            방문하여 다른 제3자 광고 사업자의 맞춤 광고 쿠키도 일괄 거부할 수 있습니다.
          </li>
        </ul>
        <p class="text-body text-muted-foreground">
          맞춤 광고를 해제하더라도 광고 자체는 계속 표시될 수 있으며, 이 경우 관심사와 무관한 일반 광고가 게재됩니다.
        </p>

        <h2 class="text-heading font-bold">5. 개인정보의 제3자 제공</h2>
        <p class="text-body text-muted-foreground">
          운영자는 이용자의 개인정보를 제3자에게 판매하거나 임의로 제공하지 않습니다.
          다만 위에서 안내한 분석·광고 도구가 쿠키를 통해 수집하는 정보는 각 사업자의 개인정보 처리방침에 따라 처리되며,
          법령에 근거한 적법한 요청이 있는 경우에 한해 관련 정보가 제공될 수 있습니다.
        </p>

        <h2 class="text-heading font-bold">6. 이용자의 권리와 행사 방법</h2>
        <p class="text-body text-muted-foreground">
          이용자는 언제든지 브라우저 설정을 통해 쿠키 저장을 거부·삭제할 수 있고,
          위 광고 설정 페이지에서 맞춤 광고를 관리할 수 있습니다.
          본 서비스가 개인 식별 정보를 직접 수집하지 않으므로 별도의 열람·정정·삭제 절차는 없으나,
          개인정보 처리에 관한 의문이나 요청이 있는 경우 아래 문의처로 연락하면 지체 없이 확인하여 답변합니다.
        </p>

        <h2 class="text-heading font-bold">7. 개인정보 보호책임 및 문의</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 ShakiLabs가 운영하며, 개인정보 관련 문의는 아래 이메일로 접수합니다.
        </p>
        <p class="text-body text-muted-foreground">
          운영: ShakiLabs · 문의:
          <a :href="`mailto:${constantsStore.supportEmail}`" class="retro-link">
            {{ constantsStore.supportEmail }}
          </a>
        </p>

        <h2 class="text-heading font-bold">8. 방침의 변경</h2>
        <p class="text-body text-muted-foreground">
          법령 개정이나 서비스 변경에 따라 본 방침이 수정될 수 있으며, 변경 시 본 페이지에 게시하고 시행일을 갱신합니다.
        </p>

        <p class="text-tiny text-muted-foreground mt-6">시행일: 2026년 3월 15일 · 최종 개정일: 2026년 8월 5일</p>
      </div>
    </div>
  </div>
</template>
