# worldcoffee 前端质感升级方案

## 目标
基于当前 Vue3 前端，采用 UI 技术栈升级，打造高质感、咖啡主题精品界面。

## 新增技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Tailwind CSS** | 3.4 | 原子化CSS框架，自定义咖啡色系 design tokens |
| **@iconify/vue** | 4.x | 统一图标库，替代 emoji |
| **@vueuse/motion** | 2.x | 页面入场动画 + 按钮微交互 |
| **@vueuse/core** | 10.x | 响应式工具、暗色模式（可选） |
| **Google Fonts** | - | DM Serif Display（标题） + Inter（正文） |
| **clsx + tailwind-merge** | - | 类名合并工具，防冲突 |

不引入 Element Plus / Naive UI 等组件库——用 Tailwind 手写更能做出独特的咖啡质感，不会有"模板感"。

## 咖啡色系 Design Tokens（Tailwind 扩展色板）

```
coffee-bean:  #3E2723  (深烘豆 - 主色)
coffee-brown: #6D4C41  (中烘 - 边框/强调)
coffee-mocha: #8D6E63  (摩卡 - 次文字)
coffee-latte: #D7CCC8  (拿铁 - 分割线/浅底)
coffee-cream: #FFF8E1  (奶油 - 页面底色)
coffee-foam:  #F5F0EB  (奶泡 - 卡片底色)
coffee-honey: #FFB74D  (蜂蜜 - 高亮/悬停)
```

## 三个页面改造方案

### 登录页
- 大号衬线标题，英文 "World Coffee" + 中文 slogan
- 玻璃拟态卡片（backdrop-blur + 微透明背景）
- 输入框悬浮时发光边框
- 登录按钮 hover 时微微上浮 + 阴影扩散
- 背景：CSS 粒子飘浮咖啡豆 + 蒸汽动画
- 右下角装饰：咖啡杯轮廓 SVG

### 注册页
- 与登录页统一样式
- 步骤感：3个小圆点指示当前进度（可选）
- 手机号输入框带国旗前缀（+86）
- 密码强度指示条（弱/中/强三段色）

### 个人中心页（Me）
- 顶部导航栏：毛玻璃效果 + 品牌 logo
- 大头像 + 用户名 + 个性签名
- 信息卡片网格：4宫格，每个卡片带图标 + 标签 + 值
- 悬停时卡片微微上浮
- 退出按钮：hover 渐变红色
- 骨架屏加载动画（Skeleton Loader）

## 动画细节

| 位置 | 动画 | 时长 |
|------|------|------|
| 页面入场 | fade + slide-up | 0.4s |
| 卡片悬浮 | translateY(-4px) + shadow | 0.2s |
| 按钮点击 | scale(0.97) → scale(1) | 0.15s |
| Toast 弹入 | slide-down + fade | 0.3s |
| 加载中 | 骨架屏呼吸 | 1.5s loop |
| 蒸汽 | scale + opacity 呼吸 | 3s loop |

## 文件改动清单

```
worldcoffee-frontend/
├── package.json                    ← 新增依赖
├── tailwind.config.js              ← 新增：咖啡色系 + 字体配置
├── postcss.config.js               ← 新增
├── vite.config.js                  ← 不动
├── index.html                      ← 加 Google Fonts CDN link
├── src/
│   ├── main.js                     ← 加 @vueuse/motion 插件
│   ├── style.css                   ← 重写：@tailwind 指令 + 自定义全局样式
│   ├── App.vue                     ← 更新组件名
│   ├── router/index.js             ← 不动
│   ├── api/index.js                ← 不动
│   ├── views/
│   │   ├── Login.vue               ← 重写：Tailwind + 玻璃卡片 + 蒸汽动画
│   │   ├── Register.vue            ← 重写：Tailwind + 统一风格
│   │   └── Me.vue                  ← 重写：Tailwind + 骨架屏 + 信息网格
│   └── components/
│       ├── AppButton.vue           ← 新增：通用咖啡按钮组件
│       ├── AppInput.vue            ← 新增：通用输入框组件
│       ├── AppCard.vue             ← 新增：通用卡片容器
│       └── AppToast.vue            ← 新增：Toast 消息组件
```

## 实施步骤

1. 更新 package.json，安装 Tailwind / Iconify / VueUse Motion
2. 创建 tailwind.config.js（咖啡色系 + serif/sans 字体栈）
3. 创建 postcss.config.js
4. 更新 index.html（Google Fonts）
5. 重写 style.css（Tailwind 指令 + CSS变量保留 + 粒子动画）
6. 创建 4 个通用组件（Button, Input, Card, Toast）
7. 重写 Login.vue
8. 重写 Register.vue
9. 重写 Me.vue





改动总结
1. api/index.js — 新增咖啡 API
方法	路径	作用
coffeeApi.listPosts(page, size)	GET /api/coffee/posts	首页列表
coffeeApi.getPost(id)	GET /api/coffee/posts/{id}	帖子详情
coffeeApi.search(keyword, page, size)	GET /api/coffee/search	搜索
coffeeApi.createPost(data)	POST /api/coffee/posts	发帖
coffeeApi.toggleLike(id)	POST /api/coffee/posts/{id}/like	点赞
coffeeApi.addComment(id, content)	POST /api/coffee/posts/{id}/comment	评论
coffeeApi.toggleFavorite(id)	POST /api/coffee/posts/{id}/favorite	收藏
2. views/Home.vue — 全新首页
毛玻璃导航栏 + 搜索框
CSS Columns 瀑布流布局（响应式：手机2列 → 桌面4列）
帖子卡片：标题 + 内容预览 + 咖啡标签 + 点赞/评论数
点击卡片弹出详情弹窗（带点赞/收藏交互）
骨架屏加载态 + 加载更多 + 空状态
3. router/index.js — 路由更新
/ → 首页（Home.vue）
登录/注册成功后跳首页而非个人中心
已登录用户访问登录/注册页自动跳首页
4. views/Me.vue — 加返回首页按钮
导航栏加了"首页"按钮，方便在首页和个人中心之间切换。

启动前端 npm run dev，打开 http://localhost:3000 就能看到咖啡社区首页了。