/**
 * @wc/shared Tailwind 预设
 * 主题（咖啡色板 + CSS 变量语义色 + 动画）三端共享的唯一事实来源。
 * 各 app 的 tailwind.config.js 通过 presets: [sharedPreset] 引入，
 * 并在自己的 content 里额外覆盖本包源码路径。
 */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        coffee: {
          espresso: '#2C1810',
          bean: '#3E2723',
          dark: '#4E342E',
          brown: '#6D4C41',
          mocha: '#8D6E63',
          latte: '#A1887F',
          sand: '#D7CCC8',
          cream: '#F5F0EB',
          foam: '#FAF7F5',
          milk: '#FFF8E1',
          honey: '#EEC27B',
          amber: '#D48A5D',
          orange: '#E8A87C',
          green: '#7CAE8C',
          rose: '#E88B8B',
          sky: '#8DB4C7'
        },
        // 语义化主题色：由 CSS 变量驱动，支持 light/dark class 切换
        surface: {
          DEFAULT: 'var(--bg-primary)',
          soft: 'var(--bg-secondary)',
          elevated: 'var(--bg-elevated)',
          card: 'var(--bg-card)'
        },
        ink: {
          DEFAULT: 'var(--text-primary)',
          soft: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)'
        },
        brand: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-cream)',
          hover: 'var(--accent-hover)'
        },
        line: {
          DEFAULT: 'var(--border)',
          soft: 'var(--divider)'
        },
        glass: {
          bg: 'var(--glass-bg)',
          border: 'var(--glass-border)'
        },
        shadow: {
          card: 'var(--shadow-card)',
          elevated: 'var(--shadow-elevated)'
        },
        // 语义化状态色
        amber: {
          DEFAULT: '#D48A5D',
          soft: 'rgba(238, 194, 123, 0.18)'
        },
        rose: {
          DEFAULT: '#EF4444',
          soft: 'rgba(232, 139, 139, 0.12)'
        },
        green: {
          DEFAULT: '#7CAE8C'
        }
      },
      fontFamily: {
        serif: ['"DM Serif Display"', '"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['Inter', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(62,39,35,0.05), 0 1px 3px rgba(62,39,35,0.03)',
        'soft': '0 1px 2px rgba(62,39,35,0.05), 0 2px 8px rgba(62,39,35,0.06)',
        'card': 'var(--shadow-card)',
        'elevated': 'var(--shadow-elevated)',
        'ins': '0 2px 6px rgba(62,39,35,0.08), 0 6px 24px rgba(62,39,35,0.10)',
        'glow': '0 0 0 4px rgba(109,76,65,0.12)',
        'toast': '0 8px 32px rgba(62,39,35,0.18)'
      },
      borderRadius: {
        'coffee': '14px',
        'coffee-sm': '10px',
        'coffee-lg': '20px',
        'xl': '20px'
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'gentle': 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
        '350': '350ms'
      },
      lineHeight: {
        'relaxed': '1.65'
      },
      animation: {
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fadeIn 0.4s ease both',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'heart': 'heartBeat 0.6s ease',
        'float': 'float 5s ease-in-out infinite',
        'toast-in': 'toastIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'shake': 'shake 0.3s ease',
        'pop': 'pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'ripple': 'ripple 0.8s linear infinite',
        'shimmer': 'shimmer 1.6s ease-in-out infinite',
        'spin-slow': 'spin 1.4s linear infinite',
        'steam': 'steam 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'theme-fade': 'themeColors 0.4s ease-out'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        heartBeat: {
          '0%': { transform: 'scale(1)' },
          '15%': { transform: 'scale(1.35)' },
          '30%': { transform: 'scale(0.95)' },
          '45%': { transform: 'scale(1.15)' },
          '60%': { transform: 'scale(1)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-6px) rotate(1deg)' },
          '66%': { transform: 'translateY(-3px) rotate(-1deg)' }
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, -28px) scale(0.92)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0) scale(1)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' }
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.4' },
          '100%': { transform: 'scale(2.4)', opacity: '0' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        steam: {
          '0%': { opacity: '0', transform: 'translateY(0) scale(1)' },
          '50%': { opacity: '0.5' },
          '100%': { opacity: '0', transform: 'translateY(-20px) scale(1.6)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' }
        },
        themeColors: {
          '0%': { opacity: '0.92' },
          '100%': { opacity: '1' }
        }
      }
    }
  },
  plugins: []
}
