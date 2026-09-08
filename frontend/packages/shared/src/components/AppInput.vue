<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium text-ink pl-1">
      {{ label }}
    </label>
    <div class="relative">
      <span v-if="prefix" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-muted select-none">
        {{ prefix }}
      </span>
      <input
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :class="[
          'input-coffee',
          prefix ? 'pl-12' : '',
          error ? 'has-error' : '',
          showCounter && maxlength ? 'pr-16' : ''
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @keyup.enter="$emit('enter')"
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-brand transition-colors"
        @click="showPw = !showPw"
        aria-label="切换密码可见性"
      >
        <Icon :icon="showPw ? 'material-symbols:visibility-off' : 'material-symbols:visibility'" class="w-5 h-5" />
      </button>
    </div>
    <div class="flex items-start justify-between gap-2 px-1">
      <p v-if="error" class="text-xs text-red-500 animate-fade-in">{{ error }}</p>
      <span v-else></span>
      <span
        v-if="showCounter && maxlength"
        class="text-[11px] text-ink-muted/80 shrink-0"
        :class="{ 'text-amber': counterNearLimit, 'text-rose': counterExceeded }"
      >
        {{ (modelValue || '').length }} / {{ maxlength }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  modelValue: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  label: String,
  prefix: String,
  error: String,
  autocomplete: String,
  maxlength: { type: [String, Number], default: null },
  showCounter: { type: Boolean, default: false }
})

defineEmits(['update:modelValue', 'enter'])

const showPw = ref(false)
const inputType = computed(() => {
  if (props.type === 'password' && showPw.value) return 'text'
  return props.type
})

const currentLength = computed(() => (props.modelValue || '').length)
const counterNearLimit = computed(() => {
  if (!props.maxlength) return false
  return currentLength.value >= Number(props.maxlength) * 0.85 && !counterExceeded.value
})
const counterExceeded = computed(() => {
  if (!props.maxlength) return false
  return currentLength.value >= Number(props.maxlength)
})
</script>
