<template>
  <div class="wc-web-shell min-h-screen">
    <header v-if="showHeader" class="wc-web-shell-header sticky top-0 z-40">
      <div class="wc-web-shell-header-inner mx-auto px-6 h-16 flex items-center justify-between">
        <button v-if="back" class="wc-web-shell-back tap-scale" @click="$emit('back')">
          <Icon icon="material-symbols:arrow-back" class="w-5 h-5" />
          <span>{{ backLabel }}</span>
        </button>
        <div v-else class="w-[86px]" />

        <div class="wc-web-shell-title">
          <strong>{{ title }}</strong>
          <em v-if="subtitle">{{ subtitle }}</em>
        </div>

        <div class="wc-web-shell-actions">
          <slot name="actions" />
        </div>
      </div>
    </header>

    <main class="wc-web-shell-main mx-auto px-6" :class="mainClass">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineEmits(['back'])

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  back: { type: Boolean, default: true },
  backLabel: { type: String, default: '返回' },
  showHeader: { type: Boolean, default: true },
  mainClass: { type: [String, Array, Object], default: 'py-8' }
})
</script>

<style scoped>
.wc-web-shell {
  background:
    radial-gradient(circle at 8% 0%, rgba(166, 106, 67, .16), transparent 28%),
    radial-gradient(circle at 94% 12%, rgba(215, 204, 200, .24), transparent 30%),
    linear-gradient(180deg, #fbf7f2 0%, var(--bg-primary) 54%);
}
.wc-web-shell-header {
  background: color-mix(in srgb, var(--bg-elevated) 84%, transparent);
  border-bottom: 1px solid var(--divider);
  box-shadow: 0 10px 28px rgba(62, 39, 35, .055);
  backdrop-filter: blur(18px);
}
.wc-web-shell-header-inner,
.wc-web-shell-main {
  width: min(1120px, 100%);
}
.wc-web-shell-back {
  gap: 8px;
  height: 38px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--bg-secondary) 58%, transparent);
  font-size: 13px;
  font-weight: 800;
}
.wc-web-shell-title {
  text-align: center;
}
.wc-web-shell-title strong {
  display: block;
  color: var(--text-primary);
  font-size: 17px;
  font-weight: 950;
}
.wc-web-shell-title em {
  display: block;
  color: var(--text-muted);
  font-size: 10px;
  font-style: normal;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.wc-web-shell-actions {
  min-width: 86px;
  display: flex;
  justify-content: flex-end;
}
</style>
