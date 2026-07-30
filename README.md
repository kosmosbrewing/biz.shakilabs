# 사업자 계산기 · shakilabs

**▶ 라이브 서비스: <https://shakilabs.com/biz>**

개인사업자 vs 법인 세후소득 비교, 법인세, 간이 vs 일반과세, 손익분기점 등 사업자 계산기 모음.

## 주요 도구

- [개인 vs 법인](https://shakilabs.com/biz/individual-vs-corp)
- [법인세](https://shakilabs.com/biz/corp-tax)
- [간이 vs 일반과세](https://shakilabs.com/biz/vat-compare)
- [손익분기점](https://shakilabs.com/biz/break-even)
- [인건비(4대보험 포함)](https://shakilabs.com/biz/labor-cost)

전체 서비스 12종: <https://shakilabs.com>

## 스택

Vue 3 (Composition API) · TypeScript · Vite · Tailwind CSS · 공유 UI `@shakilabs/ui`
정적 프리렌더/SSG로 배포하며, 계산 로직은 Vitest 경계값 테스트로 검증합니다.

## 개발

```bash
cd client
npm install
npm run dev
```
