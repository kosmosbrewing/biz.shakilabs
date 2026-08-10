<script setup lang="ts">
import SEOHead from "@/components/common/SEOHead.vue";
import { useConstantsStore } from "@/stores/constants";

const constantsStore = useConstantsStore();
</script>

<template>
  <SEOHead
    title="이용약관"
    description="사업자 계산기(shakilabs.com/biz)의 이용약관입니다. 9개 계산기가 제공하는 추정치의 성격, 세무·노무 대리가 아니라는 점, 세율·수수료 데이터의 기준일과 한계, 광고 게재와 면책 범위를 안내합니다."
  />

  <div class="container py-5">
    <div class="retro-panel">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">이용약관</h1>
      </div>

      <div class="retro-panel-content space-y-4">
        <h2 class="text-heading font-bold">1. 목적</h2>
        <p class="text-body text-muted-foreground">
          본 약관은 ShakiLabs가 운영하는 사업자 계산기(shakilabs.com/biz, 이하 "본 서비스")의 이용 조건과
          운영자·이용자의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
          이용자가 본 서비스를 이용하는 경우 본 약관에 동의한 것으로 봅니다.
        </p>

        <h2 class="text-heading font-bold">2. 본 서비스가 제공하는 것</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 개인사업자와 법인을 운영하며 마주치는 금액을 미리 가늠해 보도록 돕는 무료 계산 도구이며,
          다음 9개 계산기로 구성됩니다.
        </p>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>사업 형태·세금: 개인 vs 법인 세후소득 비교, 법인세, 간이과세 vs 일반과세 부가세, 기준경비율</li>
          <li>비용·수익: 손익분기점(BEP), 인건비(4대보험·퇴직급여 포함), 업무용 차량 경비, 배달앱 수수료, 회의 비용</li>
        </ul>
        <p class="text-body text-muted-foreground">
          모든 계산은 이용자가 입력한 매출·비용·급여 등의 값과 공개된 세율·요율 자료를 근거로
          이용자의 브라우저 안에서 수행되며, 운영자는 입력값을 서버에 저장하지 않습니다.
          각 계산기에는 적용 세율과 데이터 기준일이 함께 표기되므로 이용자는 계산 근거를 직접 확인할 수 있습니다.
        </p>

        <h2 class="text-heading font-bold">3. 세무·노무 대리가 아닙니다</h2>
        <p class="text-body text-muted-foreground">
          본 서비스가 제공하는 계산 결과와 안내 문구는 일반적인 정보 제공 목적이며, 전문가의 자문을 대체하지 않습니다.
          구체적으로 운영자는 다음 행위를 하지 않습니다.
        </p>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>세무사법에서 정한 세무 대리: 세무 신고서 작성·제출, 기장 대행, 세무 상담을 수행하지 않습니다.</li>
          <li>공인노무사법에서 정한 노무 자문: 인건비 계산기의 결과는 근로계약, 임금 체계 설계, 4대보험 신고에 관한 자문이 아닙니다.</li>
          <li>법인 설립 대행, 회계 감사, 법률 자문을 수행하지 않습니다.</li>
        </ul>
        <p class="text-body text-muted-foreground">
          계산 결과는 법적 효력이 있는 신고서·확인서·견적이 아니며, 실제 신고·납부 전에는
          국세청 홈택스 또는 세무 전문가를 통해 반드시 확인해야 합니다.
        </p>

        <h2 class="text-heading font-bold">4. 추정치의 한계 (계산기별)</h2>
        <p class="text-body text-muted-foreground">
          사업자 세금과 비용은 업종, 장부 작성 방식, 공제·감면 적용 여부, 계약 조건에 따라 실제 금액이 크게 달라집니다.
          본 서비스는 대표적인 조건을 가정해 계산하므로 다음과 같은 차이가 생길 수 있습니다.
        </p>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>
            개인 vs 법인 비교는 대표이사 급여와 배당을 단순화한 모형입니다.
            실제로는 급여·배당 설계, 가지급금, 4대보험 부담, 법인 설립·유지 비용까지 따져야 하므로 유불리가 뒤집힐 수 있습니다.
          </li>
          <li>
            부가세 비교는 업종별 부가가치율과 간이과세 기준을 적용한 추정입니다.
            간이과세 적용 여부는 직전 연도 공급대가, 업종, 사업장 요건에 따라 결정되며 세법 개정으로 기준 금액이 바뀔 수 있습니다.
          </li>
          <li>
            인건비 계산은 업종별 산재보험 요율과 퇴직급여 적립분까지 반영한 사업주 부담 추정치입니다.
            다만 근로자 급여에서 떼는 소득세·지방소득세 원천징수분과 두루누리 등 보험료 지원 제도는 반영하지 않으므로,
            근로자 실수령액과 사업주 실부담액 모두 실제와 차이가 납니다.
          </li>
          <li>
            기준경비율·단순경비율 계산은 장부를 작성하지 않은 경우의 추계 방식을 가정하며, 장부를 작성하면 결과가 달라집니다.
          </li>
          <li>
            배달앱 수수료 비교는 배달의민족·쿠팡이츠·요기요의 공개된 요금제를 기준으로 하며,
            실제 정산액은 요금제 선택, 프로모션, 배달비 부담 방식, 광고비에 따라 달라집니다.
            플랫폼이 정책을 변경해도 즉시 반영되지 않을 수 있습니다.
          </li>
          <li>업무용 차량 경비는 업무 사용비율에 따른 손금 인정액 추정이며, 운행기록부 작성 여부와 차량 종류에 따라 한도가 달라집니다.</li>
        </ul>

        <h2 class="text-heading font-bold">5. 데이터 기준일</h2>
        <p class="text-body text-muted-foreground">
          본 서비스가 사용하는 세율·요율·수수료 자료의 기준일은
          <strong class="text-foreground">{{ constantsStore.feeDataUpdated }}</strong>이며,
          운영자는 세법 개정과 플랫폼 요금제 변경을 주기적으로 확인해 갱신합니다.
          다만 개정 시점과 반영 시점 사이에는 시차가 있을 수 있으므로, 기준일 이후에 바뀐 제도는 반영되지 않았을 수 있습니다.
          최신 세율은 국세청, 4대보험 요율은 각 공단, 플랫폼 수수료는 각 사업자의 공지에서 최종 확인해야 합니다.
        </p>

        <h2 class="text-heading font-bold">6. 서비스의 이용</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 회원가입이나 결제 없이 누구나 무료로 이용할 수 있습니다.
          운영자는 계산기를 추가·변경할 수 있으며, 불가피한 사정이 있는 경우 서비스의 일부 또는 전부를 사전 고지 후 중단할 수 있습니다.
          이용자는 자동화된 수단으로 과도하게 호출하거나 정상적인 운영을 방해하는 행위를 해서는 안 됩니다.
        </p>

        <h2 class="text-heading font-bold">7. 광고 게재</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 무료 운영 재원을 마련하기 위해 Google AdSense 등 제3자 광고 플랫폼이 제공하는 광고를 화면에 게재할 수 있습니다.
          광고의 내용은 광고 플랫폼과 광고주가 결정하며, 운영자는 개별 광고를 사전에 선택하거나 보증하지 않습니다.
          특히 세무·기장·법인 설립·대출을 권유하는 광고가 노출되더라도 이는 운영자의 추천이 아니며,
          이용자가 광고주와 거래하는 경우 그 거래의 당사자는 이용자와 광고주입니다.
          광고 쿠키의 사용과 맞춤 광고 해제 방법은 개인정보 처리방침에서 안내합니다.
        </p>

        <h2 class="text-heading font-bold">8. 면책</h2>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>계산 결과는 참고용 추정치이며 실제 세액, 4대보험료, 수수료 정산액과 차이가 있을 수 있습니다.</li>
          <li>본 서비스의 결과를 근거로 한 사업 형태 결정, 신고, 채용, 계약, 가격 책정 등 의사결정과 그 결과에 대한 책임은 이용자에게 있습니다.</li>
          <li>운영자는 천재지변, 통신 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
        </ul>

        <h2 class="text-heading font-bold">9. 지식재산권</h2>
        <p class="text-body text-muted-foreground">
          본 서비스의 디자인, 코드, 콘텐츠에 대한 권리는 운영자에게 있습니다.
          계산 결과의 공유·인용은 출처를 표기하는 조건으로 자유롭게 할 수 있으나,
          서비스 자체를 복제하거나 상업적으로 재배포하는 행위는 금지합니다.
        </p>

        <h2 class="text-heading font-bold">10. 약관의 변경 및 준거법</h2>
        <p class="text-body text-muted-foreground">
          운영자는 관련 법령을 위반하지 않는 범위에서 본 약관을 개정할 수 있으며,
          개정 시 본 페이지에 게시하고 시행일을 갱신합니다. 개정 이후 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 봅니다.
          본 약관은 대한민국 법령에 따라 해석됩니다.
        </p>

        <h2 class="text-heading font-bold">11. 문의</h2>
        <p class="text-body text-muted-foreground">
          운영: ShakiLabs · 문의:
          <a :href="`mailto:${constantsStore.supportEmail}`" class="retro-link">
            {{ constantsStore.supportEmail }}
          </a>
        </p>

        <p class="text-tiny text-muted-foreground mt-6">시행일: 2026년 3월 15일 · 최종 개정일: 2026년 8월 10일</p>
      </div>
    </div>
  </div>
</template>
