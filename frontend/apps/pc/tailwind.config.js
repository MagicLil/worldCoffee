import sharedPreset from '@wc/shared/tailwind-preset'

/** @type {import('tailwindcss').Config} */
export default {
  presets: [sharedPreset],
  // 额外扫描 shared 包源码，保证共享组件里的类名被生成
  content: [
    './index.html',
    './src/**/*.{vue,js}',
    '../../packages/shared/src/**/*.{vue,js}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
