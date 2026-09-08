<template>
  <button
    :class="[
      'relative inline-flex items-center justify-center gap-2 font-medium',
      'rounded-[10px] transition-all tap-scale select-none',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
      sizeClasses,
      variantClasses
    ]"
    :disabled="loading || disabled"
    @click="$emit('click', $event)"
  >
    <svg v-if="loading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  loading: Boolean,
  disabled: Boolean
})

defineEmits(['click'])

const sizeClasses = computed(() => ({
  sm: 'px-3.5 py-2 text-[13px]',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base'
}[props.size]))

const variantClasses = computed(() => ({
  primary: 'brand-gradient-btn hover:brightness-95',
  secondary: 'bg-surface-elevated text-brand border border-line hover:bg-surface hover:border-ink/40 shadow-sm',
  danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
  ghost: 'text-brand hover:bg-line/30',
  accent: 'bg-gradient-to-br from-amber-400 to-amber-500 text-ink shadow-[0_4px_14px_rgba(255,152,0,0.3)] hover:shadow-[0_6px_22px_rgba(255,152,0,0.42)] hover:brightness-105'
}[props.variant]))
</script>
