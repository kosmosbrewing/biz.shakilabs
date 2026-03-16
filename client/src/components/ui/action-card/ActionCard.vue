<script setup lang="ts">
import { Primitive } from "radix-vue";
import { actionCardVariants, type ActionCardVariants } from ".";
import { cn } from "@/lib/utils";

type ActionCardClassValue = string | string[] | Record<string, boolean>;

const props = withDefaults(
  defineProps<{
    variant?: ActionCardVariants["variant"];
    as?: string | object;
    asChild?: boolean;
    class?: ActionCardClassValue;
  }>(),
  {
    variant: "default",
    as: "button",
    asChild: false,
    class: "",
  }
);
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    :class="cn(actionCardVariants({ variant: props.variant }), props.class)"
  >
    <slot />
  </Primitive>
</template>
