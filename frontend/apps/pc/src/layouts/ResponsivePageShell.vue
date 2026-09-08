<template>
  <WebPageShell
    v-if="isDesktop"
    :title="title"
    :subtitle="subtitle"
    :back="back"
    :back-label="backLabel"
    :show-header="showHeader"
    :main-class="webMainClass"
    @back="$emit('back')"
  >
    <template #actions>
      <slot name="web-actions">
        <slot name="actions" />
      </slot>
    </template>
    <slot name="web">
      <slot />
    </slot>
  </WebPageShell>

  <MobilePageShell
    v-else
    :title="title"
    :subtitle="mobileSubtitle || subtitle"
    :back="back"
    :show-header="showHeader"
    :main-class="mobileMainClass"
    @back="$emit('back')"
  >
    <template #actions>
      <slot name="mobile-actions">
        <slot name="actions" />
      </slot>
    </template>
    <slot name="mobile">
      <slot />
    </slot>
  </MobilePageShell>
</template>

<script setup lang="ts">
import { useViewportMode } from '@wc/shared'
import WebPageShell from './WebPageShell.vue'
import MobilePageShell from './MobilePageShell.vue'

defineEmits(['back'])

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  mobileSubtitle: { type: String, default: '' },
  back: { type: Boolean, default: true },
  backLabel: { type: String, default: '返回' },
  showHeader: { type: Boolean, default: true },
  webMainClass: { type: [String, Array, Object], default: 'py-8' },
  mobileMainClass: { type: [String, Array, Object], default: 'pt-5' }
})

const { isDesktop } = useViewportMode()
</script>
