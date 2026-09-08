import { computed, onMounted, onUnmounted, ref } from 'vue'

const width = ref(typeof window === 'undefined' ? 1440 : window.innerWidth)
let listening = false

function updateWidth() {
  width.value = window.innerWidth
}

export function useViewportMode() {
  onMounted(() => {
    if (typeof window === 'undefined' || listening) return
    listening = true
    updateWidth()
    window.addEventListener('resize', updateWidth, { passive: true })
  })

  onUnmounted(() => {
    // 保持全局 width 可复用；页面卸载时不移除监听，避免多页面切换抖动。
  })

  const isMobile = computed(() => width.value < 768)
  const isTablet = computed(() => width.value >= 768 && width.value < 1024)
  const isDesktop = computed(() => width.value >= 1024)
  const mode = computed(() => (isDesktop.value ? 'web' : 'mobile'))

  return {
    width,
    mode,
    isMobile,
    isTablet,
    isDesktop
  }
}

