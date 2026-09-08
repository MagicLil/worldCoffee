<template>
  <div class="min-h-screen pb-24 md:pb-8 bg-surface/70">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-surface-elevated/90 backdrop-blur-xl border-b border-line/40">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        <button class="p-2 rounded-xl hover:bg-surface transition-colors" @click="router.back()">
          <Icon icon="material-symbols:arrow-back" class="w-5 h-5 text-brand" />
        </button>
        <h1 class="text-base font-semibold text-ink flex-1">关于我们</h1>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 pt-8 space-y-6">

      <!-- Logo + 名称 -->
      <div class="text-center animate-fade-up">
        <div class="w-20 h-20 mx-auto rounded-3xl brand-gradient-btn shadow-lg flex items-center justify-center mb-4">
          <WorldCoffeeLogoMini :size="44" :with-circle="false" />
        </div>
        <h2 class="text-xl font-bold text-ink">World Coffee</h2>
        <p class="text-sm text-ink-muted mt-1">发现世界好咖啡</p>
        <p class="text-xs text-ink-muted/80 mt-2">版本 1.0.0</p>
      </div>

      <!-- 简介 -->
      <div class="bg-surface-elevated rounded-3xl shadow-[0_6px_28px_rgba(62,39,35,0.10)] overflow-hidden animate-fade-up" style="animation-delay: 0.04s">
        <div class="px-5 py-3.5 border-b border-line/40 flex items-center gap-2">
          <Icon icon="material-symbols:local-cafe-outline" class="w-5 h-5 text-brand" />
          <h3 class="text-sm font-bold text-ink">应用简介</h3>
        </div>
        <div class="p-5">
          <p class="text-sm text-ink-soft leading-relaxed">
            World Coffee 是一款咖啡社交电商平台，汇聚全球咖啡爱好者的分享与发现。在这里，你可以记录每一杯好咖啡的味道，分享你的咖啡故事，也能在商城中选购来自世界各地的精品咖啡豆。
          </p>
        </div>
      </div>

      <!-- 功能亮点 -->
      <div class="bg-surface-elevated rounded-3xl shadow-[0_6px_28px_rgba(62,39,35,0.10)] overflow-hidden animate-fade-up" style="animation-delay: 0.08s">
        <div class="px-5 py-3.5 border-b border-line/40 flex items-center gap-2">
          <Icon icon="material-symbols:star-outline" class="w-5 h-5 text-brand" />
          <h3 class="text-sm font-bold text-ink">功能亮点</h3>
        </div>
        <div class="p-5 space-y-3">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon icon="material-symbols:article" class="w-4 h-4 text-brand" />
            </div>
            <div>
              <p class="text-sm font-semibold text-ink">咖啡社区</p>
              <p class="text-xs text-ink-muted mt-0.5">分享咖啡测评，交流冲泡心得</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon icon="material-symbols:shopping-bag-outline" class="w-4 h-4 text-brand" />
            </div>
            <div>
              <p class="text-sm font-semibold text-ink">精品商城</p>
              <p class="text-xs text-ink-muted mt-0.5">严选全球优质咖啡豆，一键下单</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon icon="material-symbols:group" class="w-4 h-4 text-brand" />
            </div>
            <div>
              <p class="text-sm font-semibold text-ink">关注互动</p>
              <p class="text-xs text-ink-muted mt-0.5">关注咖啡达人，点赞评论互动</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 联系信息 -->
      <div class="bg-surface-elevated rounded-3xl shadow-[0_6px_28px_rgba(62,39,35,0.10)] overflow-hidden animate-fade-up" style="animation-delay: 0.12s">
        <div class="px-5 py-3.5 border-b border-line/40 flex items-center gap-2">
          <Icon icon="material-symbols:alternate-email" class="w-5 h-5 text-brand" />
          <h3 class="text-sm font-bold text-ink">联系我们</h3>
        </div>
        <div class="p-5 space-y-2.5">
          <div class="flex items-center gap-3 text-sm">
            <Icon icon="material-symbols:alternate-email" class="w-4 h-4 text-ink-muted" />
            <span class="text-ink-muted">support@lx123123wsc.gamil.com</span>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <Icon icon="material-symbols:code" class="w-4 h-4 text-ink-muted" />
            <span class="text-ink-muted">https://github.com/MagicLil/worldCoffee</span>
          </div>
        </div>
      </div>

      <!-- 底部版权 -->
      <p class="text-center text-[11px] text-ink-muted/60 pt-2 pb-4">
        &copy; 2026 World Coffee. All rights reserved.
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { WorldCoffeeLogoMini } from '@wc/shared'

const router = useRouter()
</script>
