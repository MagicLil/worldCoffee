// ============================================================
// useTheme —— 双主题切换（浅色 / 深色）
// ============================================================
import { ref, onMounted, watch } from 'vue'

const THEME_KEY = 'wc_theme'

const isDark = ref(false)

function applyTheme(dark) {
  const root = document.documentElement
  if (dark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light') } catch {}
}

function toggleTheme() {
  isDark.value = !isDark.value
}

export function useTheme() {
  onMounted(() => {
    try {
      const saved = window.localStorage.getItem(THEME_KEY)
      if (saved === 'dark') {
        isDark.value = true
      } else if (saved === 'light') {
        isDark.value = false
      } else {
        // 首次访问：跟随系统偏好
        isDark.value = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      }
    } catch {
      isDark.value = false
    }
    applyTheme(isDark.value)
  })

  watch(isDark, (val) => {
    applyTheme(val)
  })

  return {
    isDark,
    toggleTheme
  }
}

export default useTheme
