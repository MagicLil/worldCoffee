<template>
  <div class="wc-mobile-shell min-h-screen pb-24">
    <header v-if="showHeader" class="wc-mobile-shell-header sticky top-0 z-40">
      <div class="px-4 h-14 flex items-center justify-between">
        <button v-if="back" class="wc-mobile-shell-back tap-scale" @click="$emit('back')">
          <Icon icon="material-symbols:arrow-back" class="w-5 h-5" />
        </button>
        <div v-else class="w-9" />

        <div class="wc-mobile-shell-title">
          <strong>{{ title }}</strong>
          <em v-if="subtitle">{{ subtitle }}</em>
        </div>

        <div class="wc-mobile-shell-actions">
          <slot name="actions" />
        </div>
      </div>
    </header>

    <main class="wc-mobile-shell-main px-4" :class="mainClass">
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
  showHeader: { type: Boolean, default: true },
  mainClass: { type: [String, Array, Object], default: 'pt-5' }
})
</script>

<style scoped>
.wc-mobile-shell {
  background: var(--bg-primary);
}
.wc-mobile-shell-header {
  background: color-mix(in srgb, var(--bg-elevated) 92%, transparent);
  border-bottom: 1px solid var(--divider);
  backdrop-filter: blur(16px);
}
.wc-mobile-shell-back {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--bg-secondary) 60%, transparent);
}
.wc-mobile-shell-title {
  min-width: 0;
  flex: 1;
  text-align: center;
}
.wc-mobile-shell-title strong {
  display: block;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 900;
}
.wc-mobile-shell-title em {
  display: block;
  margin-top: 1px;
  color: var(--text-muted);
  font-size: 10px;
  font-style: normal;
}
.wc-mobile-shell-actions {
  width: 36px;
  display: flex;
  justify-content: flex-end;
}
</style>
