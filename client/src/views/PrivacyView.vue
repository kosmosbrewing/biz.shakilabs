<script setup lang="ts">
import SEOHead from "@/components/common/SEOHead.vue";
import { useConstantsStore } from "@/stores/constants";

const constantsStore = useConstantsStore();

// 계산기별 실제 입력 항목. 이 표는 라우터에 등록된 9개 계산기의 입력 컨트롤에서
// 그대로 옮긴 것이라, 계산기를 추가·변경하면 여기도 같이 고쳐야 한다.
// "무엇을 수집하는가"를 앱 성격과 무관한 일반론으로 적으면 방침이 다른 앱과
// 구별되지 않을 뿐 아니라, 이용자가 자기 입력이 어떻게 다뤄지는지도 알 수 없다.
const CALCULATOR_INPUTS = [
  { name: "개인 vs 법인", path: "/individual-vs-corp", fields: "연 매출액, 경비율, 대표이사 급여" },
  { name: "법인세", path: "/corp-tax", fields: "과세표준" },
  { name: "간이 vs 일반과세", path: "/vat-compare", fields: "연 매출액, 업종, 매입 비율" },
  { name: "기준경비율", path: "/standard-expense-rate", fields: "연간 매출액, 업종, 매입비용·임차료·인건비(주요경비)" },
  { name: "손익분기점", path: "/break-even", fields: "업종, 임차료, 인건비, 기타 고정비, 변동비율, 월 영업일수" },
  { name: "인건비", path: "/labor-cost", fields: "직원 월 급여, 직원 수, 업종, 퇴직급여 포함 여부" },
  { name: "배달앱 수수료", path: "/delivery-fee", fields: "건당 주문 금액, 월 주문 건수" },
  { name: "업무용 차량 경비", path: "/car-expense", fields: "연간 차량비, 업무 사용비율, 법인세율" },
  { name: "회의 비용", path: "/meeting-cost", fields: "참석 인원, 1인당 비용, 월 회의 횟수, 개월 수" },
];
</script>

<template>
  <SEOHead
    title="개인정보 처리방침"
    description="사업자 계산기(shakilabs.com/biz)가 매출·급여·직원 수 등 경영 수치를 어떻게 다루는지, 무엇을 수집하지 않는지, 쿠키·광고·분석 도구를 어떻게 사용하는지 안내합니다."
  />

  <div class="container py-5">
    <div class="retro-panel">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">개인정보 처리방침</h1>
      </div>

      <div class="retro-panel-content space-y-4">
        <p class="text-body text-muted-foreground">
          사업자 계산기(shakilabs.com/biz, 이하 "본 서비스")는 매출액, 직원 급여, 과세표준처럼
          사업자에게 민감한 경영 수치를 입력받는 도구입니다.
          그래서 본 방침은 "개인정보를 소중히 다룬다"는 선언보다, 이용자가 입력한 숫자가
          어디까지 이동하고 어디에서 멈추는지를 항목별로 밝히는 데 중점을 둡니다.
        </p>

        <h2 class="text-heading font-bold">1. 계산기가 입력받는 항목</h2>
        <p class="text-body text-muted-foreground">
          본 서비스의 9개 계산기가 화면에서 입력받는 값은 다음이 전부입니다.
          모두 사업 운영에 관한 수치이며, 이름·연락처·주민등록번호·사업자등록번호·계좌번호 등
          개인이나 사업체를 식별할 수 있는 항목은 입력란 자체가 존재하지 않습니다.
        </p>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li v-for="item in CALCULATOR_INPUTS" :key="item.path">
            <strong class="text-foreground">{{ item.name }}</strong>
            <span class="text-muted-foreground"> ({{ item.path }})</span>: {{ item.fields }}
          </li>
        </ul>

        <h2 class="text-heading font-bold">2. 입력한 수치는 운영자 서버로 가지 않습니다</h2>
        <p class="text-body text-muted-foreground">
          위 항목의 계산은 전부 이용자의 브라우저(기기) 안에서 자바스크립트로 수행됩니다.
          본 서비스는 정적 파일로만 배포되어 있어 계산을 위해 운영자 서버에 요청을 보내는 구간이 없고,
          따라서 매출액이나 급여 같은 값이 운영자에게 전송되거나 기록되는 일도 없습니다.
          회원가입과 로그인 기능이 없으므로 입력값을 특정 이용자와 연결할 수단도 없습니다.
          다만 아래 3~4번은 입력한 수치가 기기 밖으로 나가거나 기기 안에 남는 예외이므로 꼭 확인해 주세요.
        </p>

        <h2 class="text-heading font-bold">3. 입력창에 친 숫자는 주소창에 반영되지 않습니다</h2>
        <p class="text-body text-muted-foreground">
          계산기에 값을 입력해도 주소(URL)는 바뀌지 않습니다.
          본 서비스는 입력값을 질의 문자열로 옮겨 붙이는 기능이나 계산 조건이 담긴 공유 링크를 만드는 기능을 두고 있지 않으므로,
          이용자가 친 매출액·급여가 주소를 통해 방문 기록이나 아래 6번의 분석 도구로 넘어가는 경로가 없습니다.
        </p>
        <p class="text-body text-muted-foreground">
          한 가지 예외는 금액이 주소에 미리 박혀 있는 안내용 페이지입니다.
          예를 들어 <code class="text-caption">/labor-cost/300</code>은 월 급여 300만 원이 채워진 채로 열리는 페이지이고
          <code class="text-caption">/corp-tax/10000</code>은 과세표준 1억 원이 채워진 채로 열립니다.
          이런 주소로 접속하면 그 주소 자체가 방문 기록으로 남고 분석 도구에도 전달되지만,
          여기 담긴 금액은 운영자가 미리 정해 둔 예시 값이지 이용자가 입력한 값이 아닙니다.
        </p>

        <h2 class="text-heading font-bold">4. 브라우저에 남는 값</h2>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>
            개인 vs 법인 계산기에는 "입력 기억 켜기" 버튼이 있습니다.
            이 버튼을 누른 경우에만 연 매출액·경비율·대표이사 급여가 브라우저의 세션 저장소에 저장되어
            같은 탭에서 최대 8시간 동안 복원됩니다. 기본값은 꺼짐이고, "입력 기억 끄기"를 누르거나
            탭을 닫으면 즉시 사라지며, 8시간이 지난 값은 불러오지 않고 폐기합니다.
          </li>
          <li>화면 테마(밝게·어둡게) 선택값은 로컬 저장소에 남아 다음 방문 때 같은 테마로 열립니다.</li>
          <li>
            두 저장소 모두 이용자 기기 안에만 있어 운영자는 읽을 수 없으며,
            브라우저의 인터넷 사용 기록 삭제 기능으로 언제든 지울 수 있습니다.
          </li>
        </ul>

        <h2 class="text-heading font-bold">5. 직원 정보를 대신 입력하는 사업주께</h2>
        <p class="text-body text-muted-foreground">
          인건비 계산기는 사업주가 근로자의 급여를 대신 입력하는 구조입니다.
          이때 입력하는 값은 본인이 아닌 제3자에 관한 정보라는 점에서 다른 계산기와 성격이 다릅니다.
          본 서비스는 그 값을 수집하지도 저장하지도 않지만, 계산 결과 화면을 캡처해 사업장 밖으로 전달하는 등
          화면을 벗어난 뒤의 처리는 이용자 책임 아래 이뤄집니다.
          특정 개인의 급여를 식별 가능한 형태로 외부에 공유하지 않도록 주의해 주시고,
          공용 PC에서 사용했다면 4번의 "입력 기억" 기능을 켜지 않았는지 확인해 주세요.
        </p>

        <h2 class="text-heading font-bold">6. 접속 시 자동으로 처리되는 정보 (Google Analytics 4)</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 어떤 계산기가 실제로 쓰이는지 파악해 개선하기 위해 Google Analytics 4를 사용합니다.
          이 도구는 방문한 페이지 주소, 머문 시간, 유입 경로, 브라우저·기기 종류, 대략적인 접속 지역 등
          개인을 특정하지 않는 통계 정보를 쿠키 등을 통해 수집합니다.
          계산기 사용 여부를 재는 이벤트에는 계산기 식별자와 페이지 주소만 담기며 매출액·급여 같은 입력값은 담기지 않습니다.
          다만 화면에서 오류가 발생하면 원인 파악을 위해 오류 메시지가 같은 분석 도구로 전송됩니다.
          수집된 정보는 Google의 개인정보처리방침에 따라 처리되며, 운영자는 통계 형태로만 열람합니다.
        </p>

        <h2 class="text-heading font-bold">7. 쿠키와 광고 게재 (Google AdSense)</h2>
        <p class="text-body text-muted-foreground">
          쿠키는 웹사이트가 이용자의 브라우저에 저장하는 작은 텍스트 파일입니다.
          본 서비스는 계산기를 무료로 유지하기 위해 Google AdSense를 통한 광고를 게재하며, 이와 관련해 다음을 알려드립니다.
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
          광고와 분석 쿠키는 브라우저 설정에서 거부하거나 삭제할 수 있고, 차단하더라도 9개 계산기 기능은 그대로 사용할 수 있습니다.
          한편 오류·점검 안내 화면처럼 이용자에게 제공할 내용이 없는 페이지에는 광고를 게재하지 않습니다.
        </p>

        <h2 class="text-heading font-bold">8. 제3자 제공과 보관 기간</h2>
        <p class="text-body text-muted-foreground">
          운영자는 이용자의 정보를 제3자에게 판매하거나 임의로 제공하지 않습니다.
          운영자가 별도로 보관하는 이용자 정보 자체가 없으므로 파기 절차나 보관 기간도 존재하지 않으며,
          위 6~7번의 분석·광고 도구가 쿠키로 수집하는 정보는 각 사업자의 방침과 보관 기간에 따라 처리됩니다.
          법령에 근거한 적법한 요청이 있는 경우에 한해 관련 정보가 제공될 수 있습니다.
        </p>

        <h2 class="text-heading font-bold">9. 이용자의 권리와 행사 방법</h2>
        <p class="text-body text-muted-foreground">
          이용자는 언제든지 브라우저 설정에서 쿠키 저장을 거부·삭제할 수 있고, 위 광고 설정 페이지에서 맞춤 광고를 관리할 수 있으며,
          4번의 저장값은 브라우저 기록 삭제로 직접 제거할 수 있습니다.
          본 서비스가 개인 식별 정보를 수집·보관하지 않으므로 열람·정정·삭제를 요청할 대상 자료가 없으나,
          개인정보 처리에 관한 의문이나 요청이 있는 경우 아래 문의처로 연락하면 지체 없이 확인하여 답변합니다.
        </p>

        <h2 class="text-heading font-bold">10. 문의와 방침의 변경</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 ShakiLabs가 운영하며, 개인정보 관련 문의는 아래 이메일로 접수합니다.
          법령 개정이나 계산기 추가·변경으로 처리하는 항목이 달라지면 본 방침을 수정하고, 이 페이지에 게시하며 시행일을 갱신합니다.
        </p>
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
