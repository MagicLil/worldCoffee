<!-- ============================================================
     WorldCoffee 品牌 Logo（简约大气款）
     使用： <WorldCoffeeLogo :size="120" variant="icon" />
            <WorldCoffeeLogo :size="160" variant="full" />
            <WorldCoffeeLogo :size="200" variant="mark" />
============================================================ -->
<template>
  <div
    class="inline-flex flex-col items-center justify-center select-none"
    :style="{ width: size + 'px' }"
  >
    <!-- ======= 杯体图标 ======= -->
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      class="block"
      :style="{ width: size + 'px', height: size + 'px' }"
    >
      <!-- 背景圆盘（浅色） -->
      <defs>
        <linearGradient id="wc-cup-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#6D4C41" />
          <stop offset="100%" stop-color="#3E2723" />
        </linearGradient>
        <linearGradient id="wc-cream-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#F5F0EB" />
          <stop offset="100%" stop-color="#D7CCC8" />
        </linearGradient>
        <radialGradient id="wc-steam-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#D7CCC8" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#D7CCC8" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- 外圈细描边（可选） -->
      <circle
        v-if="variant === 'mark'"
        cx="50" cy="50" r="45"
        fill="#FAF7F5" stroke="#3E2723" stroke-width="1.5"
      />

      <!-- === 咖啡杯主体（粗线条描边） === -->
      <!-- 杯体：梯形，上宽下窄 -->
      <path
        d="M25 34 L75 34 L70 72 Q68 82 50 82 Q32 82 30 72 Z"
        fill="url(#wc-cup-gradient)"
        stroke="#2C1810" stroke-width="2.5"
        stroke-linejoin="round"
      />
      <!-- 杯口（液面边缘） -->
      <path
        d="M25 34 Q50 40 75 34"
        fill="none" stroke="#2C1810" stroke-width="1.5" stroke-linecap="round"
      />
      <!-- 咖啡液表面（椭圆） -->
      <ellipse cx="50" cy="37" rx="25" ry="4" fill="#4E342E" />
      <!-- 奶泡高光（椭圆） -->
      <ellipse cx="44" cy="35.5" rx="10" ry="1.6" fill="#F5F0EB" opacity="0.85" />
      <ellipse cx="58" cy="36.5" rx="6" ry="1" fill="#F5F0EB" opacity="0.6" />

      <!-- === 杯把手 === -->
      <path
        d="M75 40 Q88 42 88 56 Q88 70 75 70"
        fill="none" stroke="#2C1810" stroke-width="3.5" stroke-linecap="round"
      />
      <!-- 把手内部描边（细线装饰） -->
      <path
        d="M75 44 Q84 46 84 56 Q84 66 75 68"
        fill="none" stroke="#3E2723" stroke-width="1" stroke-linecap="round" opacity="0.7"
      />

      <!-- === 咖啡热气（3 条波浪线） === -->
      <path
        d="M38 28 Q34 22 38 16 Q42 10 38 4"
        fill="none" stroke="#8D6E63" stroke-width="1.8" stroke-linecap="round"
        opacity="0.85"
      />
      <path
        d="M50 28 Q46 22 50 16 Q54 10 50 4"
        fill="none" stroke="#6D4C41" stroke-width="1.8" stroke-linecap="round"
        opacity="0.9"
      />
      <path
        d="M62 28 Q58 22 62 16 Q66 10 62 4"
        fill="none" stroke="#8D6E63" stroke-width="1.8" stroke-linecap="round"
        opacity="0.85"
      />

      <!-- === 咖啡杯底部阴影 === -->
      <ellipse cx="50" cy="84" rx="24" ry="3" fill="#2C1810" opacity="0.18" />
    </svg>

    <!-- ======= 文字 (full 模式) ======= -->
    <div v-if="variant === 'full'" class="mt-3 text-center leading-tight">
      <div class="font-bold tracking-wide" :style="textStyle">WORLD</div>
      <div class="font-semibold tracking-[0.28em]" :style="{ ...textStyle, color: '#3E2723', opacity: 0.9 }">COFFEE</div>
    </div>

    <!-- ======= 文字 (mark 模式：logo 下方加一行小标签) ======= -->
    <div v-if="variant === 'mark'" class="mt-2 text-center">
      <div class="font-bold tracking-[0.18em]" :style="{ color: '#2C1810', fontSize: Math.max(size * 0.09, 10) + 'px' }">WORLDCOFFEE</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  // 尺寸（px）
  size: { type: Number, default: 120 },
  // 模式：icon（仅图标）/ full（图标 + 双行文字）/ mark（图标 + 小标签文字）
  variant: { type: String, default: 'icon' }
})

const textStyle = computed(() => ({
  color: '#2C1810',
  fontSize: Math.max(props.size * 0.15, 14) + 'px',
  letterSpacing: '0.18em'
}))
</script>
