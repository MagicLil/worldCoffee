<template>
  <div class="flex flex-col items-center justify-center py-16 px-8 text-center animate-fade-up">
    <!-- 插画容器 -->
    <div class="relative mb-6">
      <!-- 背景光晕 -->
      <div class="absolute inset-0 rounded-full bg-gradient-to-br from-amber/25 via-amber/15 to-transparent blur-2xl scale-150 opacity-60" />
      <!-- 咖啡杯插画 -->
      <div class="relative w-24 h-24 rounded-full bg-gradient-to-br from-white to-surface-soft shadow-[0_4px_20px_rgba(62,39,35,0.12)] flex items-center justify-center">
        <svg viewBox="0 0 40 40" class="w-12 h-12 text-brand" fill="none">
          <!-- 蒸汽 -->
          <path d="M16 8 Q14 5 16 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.55" />
          <path d="M20 8 Q18 4 20 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.7" />
          <path d="M24 8 Q22 5 24 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.55" />
          <!-- 杯身 -->
          <path
            d="M10 16 Q10 14 12 14 L26 14 Q28 14 28 16 L27 28 Q27 31 24 31 L14 31 Q11 31 11 28 Z"
            fill="currentColor"
          />
          <ellipse cx="19" cy="16" rx="9" ry="2.2" fill="#2C1810" />
          <!-- 杯柄 -->
          <path
            d="M28 17 Q33 17 33 22.5 Q33 28 28 28"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            fill="none"
          />
        </svg>
      </div>
    </div>

    <h3 class="text-base font-semibold text-brand mb-1.5">{{ title }}</h3>
    <p class="text-sm text-ink-muted max-w-xs leading-relaxed">{{ description }}</p>

    <div v-if="$slots.default" class="mt-6">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: { type: String, default: '这里还空空的' },
  description: { type: String, default: '先去喝杯咖啡，再来点什么吧 ☕' }
})
</script>
