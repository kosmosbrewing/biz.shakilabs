import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold ring-offset-background transition-[background-color,border-color,color,transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-primary bg-primary text-white hover:text-white active:text-white shadow-sm hover:-translate-y-[1px] hover:bg-primary/90 active:translate-y-0 active:scale-[0.985] active:bg-primary/95",
        destructive: "border border-destructive bg-destructive text-white hover:text-white active:text-white shadow-sm hover:-translate-y-[1px] hover:bg-destructive/90 active:translate-y-0 active:scale-[0.985] active:bg-destructive/95",
        outline: "border border-border bg-background text-muted-foreground hover:-translate-y-[1px] hover:border-primary/40 hover:bg-primary/5 active:translate-y-0 active:scale-[0.985] active:border-primary/45 active:bg-primary/8",
        subtle: "border border-border/70 bg-card text-foreground shadow-sm hover:-translate-y-[1px] hover:border-primary/50 hover:bg-muted/20 active:translate-y-0 active:scale-[0.985] active:border-primary/55 active:bg-muted/30",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-muted-foreground hover:bg-accent/60 hover:text-muted-foreground active:bg-accent/80",
        contrast: "bg-card text-card-foreground shadow-sm hover:bg-card/92 active:scale-[0.985] active:bg-card/95",
        contrastOutline: "border border-white/35 text-white hover:bg-white/10 active:scale-[0.985] active:bg-white/14 active:text-white",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 rounded-lg px-4 py-2 text-[0.875rem] leading-[1.5]",
        sm: "min-h-10 rounded-lg px-3.5 py-2 text-[0.8125rem] leading-[1.45]",
        lg: "min-h-11 rounded-lg px-8 py-2.5 text-[0.875rem] leading-[1.5]",
        chip: "min-h-11 rounded-xl px-3 py-1.5 text-[0.8125rem] leading-[1.45]",
        chipSm: "min-h-9 rounded-xl px-2.5 py-1 text-[0.6875rem] leading-[1.35]",
        icon: "h-10 w-10 rounded-lg",
        iconSm: "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export { default as Button } from "./Button.vue";
