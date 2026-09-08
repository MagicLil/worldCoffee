/**
 * @wc/shared 统一入口
 * 三端共享：领域类型 / API 封装 / composables / 工具函数 / 基础展示组件
 * pc、mobile 通过 `import { userApi, useAuth, PostCard } from '@wc/shared'` 消费
 */
export * from './types'
export * from './api/index'
export * from './composables/useAuth'
export * from './composables/useTheme'
export * from './composables/useViewportMode'
export * from './utils/time'

// ─── 共享基础组件（无路由耦合）──────────────────
export { default as AppButton } from './components/AppButton.vue'
export { default as AppInput } from './components/AppInput.vue'
export { default as EmptyState } from './components/EmptyState.vue'
export { default as PostCard } from './components/PostCard.vue'
export { default as WorldCoffeeLogo } from './components/WorldCoffeeLogo.vue'
export { default as WorldCoffeeLogoMini } from './components/WorldCoffeeLogoMini.vue'
export { default as WorldCoffeeAiLogo } from './components/WorldCoffeeAiLogo.vue'
