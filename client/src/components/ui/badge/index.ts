import { cva, type VariantProps } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-caption font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        // deduction/highlight 변형은 02.finance에서 복사돼 왔지만 이 앱 테마에는
        // 그 색이 없어 Tailwind가 규칙을 만들지 않았다 — 호출부도 0곳이라 제거한다.
        // bg-muted-foreground/70 + text-white는 라이트 3.37:1 · 다크 3.46:1로 양쪽 다 미달이었다.
        // 알파를 걷어내고 대비쌍(muted-foreground ↔ background)을 쓰면 라이트 6.51 · 다크 8.64.
        neutral: "border-border/50 bg-muted-foreground text-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

export { default as Badge } from "./Badge.vue";
