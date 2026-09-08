<!-- ============================================================
     WorldCoffee AI Logo — 咖啡杯 × AI 神经网络
     将品牌咖啡杯与 AI 神经网络元素融合
     使用： <WorldCoffeeAiLogo :size="36" />
============================================================ -->
<template>
  <svg
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    class="block"
    :style="{ width: size + 'px', height: size + 'px' }"
  >
    <defs>
      <!-- 背景渐变：深棕 → 暖棕 -->
      <radialGradient id="ai-bg" cx="50%" cy="45%" r="50%">
        <stop offset="0%" stop-color="#5D4037" />
        <stop offset="100%" stop-color="#2C1810" />
      </radialGradient>

      <!-- 杯体渐变 -->
      <linearGradient id="ai-cup" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#F5F0EB" />
        <stop offset="100%" stop-color="#D7CCC8" />
      </linearGradient>

      <!-- AI 节点发光 -->
      <radialGradient id="ai-node-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFD54F" stop-opacity="0.9" />
        <stop offset="60%" stop-color="#FFB300" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#FFB300" stop-opacity="0" />
      </radialGradient>

      <!-- 蒸汽/神经网络连线渐变 -->
      <linearGradient id="ai-steam" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#D7CCC8" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#FFD54F" stop-opacity="0.7" />
      </linearGradient>

      <!-- 星光滤镜 -->
      <filter id="ai-sparkle" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
      </filter>

      <!-- 杯体阴影 -->
      <filter id="ai-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#1a0f0a" flood-opacity="0.3" />
      </filter>
    </defs>

    <!-- ===== 背景圆盘 ===== -->
    <circle cx="50" cy="50" r="46" fill="url(#ai-bg)" />
    <!-- 内圈描边 -->
    <circle cx="50" cy="50" r="44" fill="none" stroke="#8D6E63" stroke-width="0.8" opacity="0.4" />

    <!-- ===== 咖啡杯 ===== -->
    <g filter="url(#ai-shadow)">
      <!-- 杯体 -->
      <path
        d="M30 42 L70 42 L66 74 Q64 80 50 80 Q36 80 34 74 Z"
        fill="url(#ai-cup)"
        stroke="#2C1810"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <!-- 杯口线 -->
      <path
        d="M30 42 Q50 46 70 42"
        fill="none"
        stroke="#2C1810"
        stroke-width="1"
        stroke-linecap="round"
      />
      <!-- 咖啡液面 -->
      <ellipse cx="50" cy="44" rx="20" ry="2.5" fill="#4E342E" />
      <!-- 奶泡高光 -->
      <ellipse cx="44" cy="43" rx="8" ry="1.2" fill="#F5F0EB" opacity="0.8" />
    </g>

    <!-- 杯把手 -->
    <path
      d="M70 48 Q80 50 80 60 Q80 70 70 70"
      fill="none"
      stroke="#2C1810"
      stroke-width="2"
      stroke-linecap="round"
    />

    <!-- ===== AI 神经网络蒸汽（3 条线 + 节点） ===== -->
    <!-- 左蒸汽线 -->
    <path
      d="M40 36 Q36 28 40 20 Q44 14 40 8"
      fill="none"
      stroke="url(#ai-steam)"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <!-- 中蒸汽线 -->
    <path
      d="M50 36 Q46 28 50 20 Q54 14 50 8"
      fill="none"
      stroke="url(#ai-steam)"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <!-- 右蒸汽线 -->
    <path
      d="M60 36 Q56 28 60 20 Q64 14 60 8"
      fill="none"
      stroke="url(#ai-steam)"
      stroke-width="1.5"
      stroke-linecap="round"
    />

    <!-- 神经网络交叉连线 -->
    <path d="M40 20 L50 14" fill="none" stroke="#FFD54F" stroke-width="0.8" opacity="0.5" />
    <path d="M50 20 L60 14" fill="none" stroke="#FFD54F" stroke-width="0.8" opacity="0.5" />
    <path d="M40 28 L50 20" fill="none" stroke="#FFD54F" stroke-width="0.6" opacity="0.35" />
    <path d="M50 28 L60 20" fill="none" stroke="#FFD54F" stroke-width="0.6" opacity="0.35" />

    <!-- ===== AI 节点（金色圆点） ===== -->
    <!-- 底层节点 -->
    <circle cx="40" cy="28" r="2.2" fill="#FFD54F" />
    <circle cx="50" cy="28" r="2.2" fill="#FFD54F" />
    <circle cx="60" cy="28" r="2.2" fill="#FFD54F" />
    <!-- 中层节点 -->
    <circle cx="40" cy="20" r="2.8" fill="#FFD54F" />
    <circle cx="50" cy="20" r="2.8" fill="#FFD54F" />
    <circle cx="60" cy="20" r="2.8" fill="#FFD54F" />
    <!-- 顶层节点 -->
    <circle cx="40" cy="8" r="2.2" fill="#FFD54F" />
    <circle cx="50" cy="8" r="2.2" fill="#FFD54F" />
    <circle cx="60" cy="8" r="2.2" fill="#FFD54F" />

    <!-- 节点发光效果 -->
    <circle cx="50" cy="20" r="5" fill="url(#ai-node-glow)" />

    <!-- ===== 星光点缀（点睛之笔） ===== -->
    <g opacity="0.9">
      <!-- 右上星光 -->
      <path
        d="M72 22 L73.5 25 L77 26.5 L73.5 28 L72 31 L70.5 28 L67 26.5 L70.5 25 Z"
        fill="#FFD54F"
        filter="url(#ai-sparkle)"
      />
      <path
        d="M72 22 L73.5 25 L77 26.5 L73.5 28 L72 31 L70.5 28 L67 26.5 L70.5 25 Z"
        fill="#FFF8E1"
      />
      <!-- 左上小星光 -->
      <path
        d="M26 30 L26.8 32 L28.8 32.8 L26.8 33.6 L26 35.6 L25.2 33.6 L23.2 32.8 L25.2 32 Z"
        fill="#FFD54F"
        opacity="0.7"
      />
    </g>

    <!-- 杯底阴影 -->
    <ellipse cx="50" cy="82" rx="18" ry="2" fill="#1a0f0a" opacity="0.2" />
  </svg>
</template>

<script setup lang="ts">
defineProps({
  size: { type: Number, default: 36 }
})
</script>
