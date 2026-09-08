<template>
  <div class="wc-create-page min-h-screen pb-28" :class="{ 'is-embedded': embedded }">
    <!-- 顶部栏：与首页统一为轻咖啡毛玻璃 -->
    <header v-if="!embedded" class="wc-create-header sticky top-0 z-30">
      <div class="max-w-[1120px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
        <button
          class="wc-create-icon-btn tap-scale"
          @click="router.back()"
          aria-label="返回"
        >
          <Icon icon="material-symbols:arrow-back" class="w-5 h-5 text-ink-soft" />
        </button>
        <div class="text-center">
          <h1 class="text-[15px] font-black text-ink tracking-tight">发布咖啡笔记</h1>
          <p class="hidden sm:block text-[10.5px] text-ink-muted mt-0.5">记录这一杯的味道、地点和小心情</p>
        </div>
        <button
          :disabled="submitting"
          class="wc-create-top-submit hidden sm:inline-flex tap-scale"
          @click="handleSubmit"
        >
          {{ submitting ? '发布中…' : '发布' }}
        </button>
      </div>
    </header>

    <main class="wc-create-main max-w-[1120px] mx-auto px-4 lg:px-6 pt-6 lg:pt-8 animate-fade-up">
      <div class="wc-create-layout">
        <section class="wc-create-card">
          <div class="wc-create-card-head">
            <div>
              <p class="wc-create-eyebrow">WORLDCOFFEE NOTE</p>
              <h2>分享一杯咖啡的瞬间</h2>
            </div>
            <span class="wc-create-draft-pill" :class="{ 'is-active': hasDraft }">
              <Icon icon="material-symbols:save-outline" class="w-4 h-4" />
              {{ hasDraft ? '草稿已保存' : '空白草稿' }}
            </span>
          </div>

          <div class="wc-create-section">
            <AppInput
              v-model="form.title"
              label="标题"
              placeholder="比如：今天这杯橙香拿铁有点惊喜"
              :maxlength="50"
              showCounter
              :error="errors.title"
            />
          </div>

          <!-- 内容（textarea） -->
          <div class="wc-create-section">
            <label class="wc-create-label">内容</label>
            <textarea
              v-model="form.content"
              rows="6"
              maxlength="1000"
              placeholder="写下味道、门店氛围、豆子风味，或者这杯咖啡陪你度过了什么时刻…"
              class="input-coffee wc-create-textarea resize-none"
            />
            <div class="flex items-center justify-between px-1 pt-1">
              <span class="text-[11px] text-ink-muted">支持换行和纯文本</span>
              <span
                class="text-[11px] shrink-0"
                :class="[
                  form.content.length >= 900 ? 'text-rose' :
                  form.content.length >= 750 ? 'text-amber' : 'text-ink-muted'
                ]"
              >
                {{ form.content.length }} / 1000
              </span>
            </div>
          </div>

          <!-- 图片上传 -->
          <div class="wc-create-section">
            <div class="flex items-end justify-between gap-3 mb-3">
              <label class="wc-create-label mb-0">图片 <span>最多 9 张</span></label>
              <p class="text-[11px] text-ink-muted">{{ uploadedImages.length }}/9</p>
            </div>
            <div class="wc-upload-grid">
              <div
                v-for="(img, i) in uploadedImages"
                :key="i"
                class="wc-upload-item group animate-fade-up"
              >
                <img :src="img" class="w-full h-full object-cover" @click="previewImage(img)" />
                <button
                  type="button"
                  class="wc-upload-remove"
                  @click="removeImage(i)"
                  aria-label="删除图片"
                >
                  <Icon icon="material-symbols:close" class="w-4 h-4 text-white" />
                </button>
              </div>
              <button
                v-if="uploadedImages.length < 9"
                type="button"
                class="wc-upload-add tap-scale"
                @click="triggerUpload"
                aria-label="添加图片"
              >
                <Icon icon="material-symbols:add-photo-alternate-outline" class="w-7 h-7" />
                <span>添加图片</span>
              </button>
            </div>
            <p v-if="uploading" class="text-xs text-ink-muted pl-1 pt-2 animate-pulse-soft">
              正在上传 {{ uploadProgress }}%…
            </p>
          </div>

          <!-- 咖啡信息 -->
          <div class="wc-create-section">
            <div class="grid sm:grid-cols-2 gap-4">
              <AppInput v-model="form.coffeeName" label="咖啡名称" placeholder="如：耶加雪菲" :maxlength="30" />
              <AppInput v-model="form.coffeeBrand" label="品牌 / 门店" placeholder="如：街角咖啡馆" :maxlength="30" />
            </div>
          </div>

          <!-- 地点 -->
          <div class="wc-create-section">
            <AppInput v-model="form.location" label="地点" placeholder="你在哪里喝的？" :maxlength="50" />
          </div>

          <div class="wc-create-section">
            <label class="wc-create-label">话题</label>
            <div v-if="form.topics.length" class="flex flex-wrap gap-2 mb-3">
              <span
                v-for="topic in form.topics"
                :key="topic"
                class="wc-create-topic"
              >
                #{{ topic }}
                <button type="button" class="text-ink-muted hover:text-rose" @click="removeTopic(topic)">×</button>
              </span>
            </div>
            <div class="flex gap-2">
              <input
                v-model="topicInput"
                class="input-coffee flex-1"
                maxlength="30"
                placeholder="输入话题后回车，如 手冲"
                @keyup.enter.prevent="addTopic"
              />
              <button type="button" class="wc-create-secondary-btn tap-scale" @click="addTopic">
                添加
              </button>
            </div>
            <div class="flex flex-wrap gap-2 mt-3">
              <button
                v-for="topic in suggestedTopics"
                :key="topic"
                type="button"
                class="wc-create-suggest tap-scale"
                @click="addTopicValue(topic)"
              >
                #{{ topic }}
              </button>
            </div>
          </div>

          <!-- 草稿指示 -->
          <div v-if="hasDraft" class="wc-create-draft-alert animate-fade-in">
            <Icon icon="material-symbols:save" class="w-4 h-4 shrink-0" />
            <span>已自动保存草稿 · 刷新页面内容会保留</span>
            <button class="ml-auto underline hover:text-brand" @click="clearDraft">清空</button>
          </div>

          <!-- 错误提示 -->
          <div v-if="serverError" class="flex items-start gap-2 text-sm text-rose bg-rose-soft border border-line/40 px-3.5 py-2.5 rounded-2xl animate-fade-in">
            <Icon icon="material-symbols:error-outline" class="w-4 h-4 mt-0.5 shrink-0" />
            <span>{{ serverError }}</span>
          </div>

          <!-- 提交按钮 -->
          <button
            :disabled="submitting"
            @click="handleSubmit"
            class="wc-create-submit tap-scale"
          >
            <svg v-if="submitting" class="animate-spin-slow w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
            </svg>
            <Icon v-else icon="material-symbols:send-outline" class="w-5 h-5" />
            <span>{{ submitting ? '发布中…' : '发布咖啡笔记' }}</span>
          </button>
        </section>

        <aside class="wc-create-rail">
          <div class="wc-create-hero-card">
            <div class="wc-create-hero-icon">
              <Icon icon="material-symbols:local-cafe-outline" class="w-6 h-6" />
            </div>
            <h3>写作小提示</h3>
            <p>好的咖啡笔记不需要很长，讲清楚“喝了什么、在哪里、有什么感受”就很有画面。</p>
          </div>

          <div class="wc-create-rail-card">
            <h4>发布清单</h4>
            <ul>
              <li :class="{ 'is-done': form.title.trim() }">
                <Icon icon="material-symbols:check-circle" class="w-4 h-4" />
                标题清楚
              </li>
              <li :class="{ 'is-done': form.content.trim() }">
                <Icon icon="material-symbols:check-circle" class="w-4 h-4" />
                写下体验
              </li>
              <li :class="{ 'is-done': uploadedImages.length > 0 }">
                <Icon icon="material-symbols:check-circle" class="w-4 h-4" />
                配一张图片
              </li>
              <li :class="{ 'is-done': form.topics.length > 0 }">
                <Icon icon="material-symbols:check-circle" class="w-4 h-4" />
                加入话题
              </li>
            </ul>
          </div>

          <div class="wc-create-rail-card">
            <h4>灵感句式</h4>
            <div class="space-y-2">
              <button
                v-for="prompt in writingPrompts"
                :key="prompt"
                type="button"
                class="wc-create-prompt tap-scale"
                @click="appendPrompt(prompt)"
              >
                {{ prompt }}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileSelect" />

    <!-- 图片预览模态 -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="previewSrc"
          class="fixed inset-0 z-[100] bg-ink/85 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
          @click.self="previewSrc = ''"
        >
          <button
            class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            @click="previewSrc = ''"
            aria-label="关闭预览"
          >
            <Icon icon="material-symbols:close" class="w-6 h-6" />
          </button>
          <img :src="previewSrc" class="max-w-full max-h-[85vh] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.4)]" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { coffeeApi, getApiError } from '@wc/shared'
import { getToken } from '@wc/shared'
import { AppInput } from '@wc/shared'

const props = defineProps({
  embedded: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['success'])
const router = useRouter()
const toast = inject<any>('toast')
const fileInput = ref(null)
const previewSrc = ref('')
const uploadProgress = ref(0)
const topicInput = ref('')
let serverDraftTimer = null

const DRAFT_KEY = 'worldcoffee:post-draft'
const suggestedTopics = ['手冲', '拉花', '咖啡馆', '冷萃', '拿铁', '咖啡豆', '探店', '甜品']
const writingPrompts = [
  '今天这杯最明显的风味是：',
  '这家店最打动我的地方是：',
  '如果你也喜欢偏甜/偏酸/坚果调，可以试试：'
]

const form = reactive({
  title: '',
  content: '',
  coffeeName: '',
  coffeeBrand: '',
  location: '',
  topics: []
})

const errors = reactive({ title: '' })
const uploadedImages = ref([])
const uploading = ref(false)
const submitting = ref(false)
const serverError = ref('')

const hasDraft = computed(() =>
  !!form.title || !!form.content || !!form.coffeeName || !!form.coffeeBrand ||
  !!form.location || uploadedImages.value.length > 0 || form.topics.length > 0
)

/* -------- 草稿持久化 -------- */
onMounted(async () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (saved && typeof saved === 'object') {
        Object.assign(form, {
          title: saved.title || '',
          content: saved.content || '',
          coffeeName: saved.coffeeName || '',
          coffeeBrand: saved.coffeeBrand || '',
          location: saved.location || '',
          topics: Array.isArray(saved.topics) ? saved.topics : []
        })
        if (Array.isArray(saved.images)) uploadedImages.value = saved.images
      }
    }
  } catch (e) { /* ignore */ }
  await loadServerDraft()
})

watch(form, saveDraft, { deep: true })
watch(uploadedImages, saveDraft, { deep: true })

function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      ...form,
      images: uploadedImages.value
    }))
  } catch (e) { /* ignore */ }
  scheduleServerDraftSave()
}

function clearDraft() {
  form.title = ''
  form.content = ''
  form.coffeeName = ''
  form.coffeeBrand = ''
  form.location = ''
  form.topics = []
  uploadedImages.value = []
  try { localStorage.removeItem(DRAFT_KEY) } catch (e) { /* ignore */ }
  if (getToken()) coffeeApi.deleteMyDraft().catch(() => {})
}

async function loadServerDraft() {
  if (!getToken()) return
  try {
    const res = await coffeeApi.getMyDraft()
    const draft = res?.data
    if (!draft) return
    Object.assign(form, {
      title: draft.title || '',
      content: draft.content || '',
      coffeeName: draft.coffeeName || '',
      coffeeBrand: draft.coffeeBrand || '',
      location: draft.location || '',
      topics: Array.isArray(draft.topics) ? draft.topics : []
    })
    if (Array.isArray(draft.images)) uploadedImages.value = draft.images
  } catch {
    // keep local draft
  }
}

function scheduleServerDraftSave() {
  if (!getToken()) return
  clearTimeout(serverDraftTimer)
  serverDraftTimer = setTimeout(() => {
    coffeeApi.saveMyDraft(buildPayload()).catch(() => {})
  }, 800)
}

/* -------- 图片上传 -------- */
function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.show('请选择图片文件', 'error')
    e.target.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.show('图片不能超过 5MB', 'error')
    e.target.value = ''
    return
  }

  uploading.value = true
  uploadProgress.value = 20
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await coffeeApi.upload(fd)
    uploadProgress.value = 80
    if (res && res.code === 200) {
      uploadedImages.value.push(res.data)
      toast.show('图片上传成功')
    } else {
      toast.show(res?.msg || '上传失败', 'error')
    }
  } catch (err) {
    toast.show(getApiError(err), 'error')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    e.target.value = ''
  }
}

function removeImage(i) {
  uploadedImages.value.splice(i, 1)
}

function previewImage(src) {
  previewSrc.value = src
}

function addTopic() {
  addTopicValue(topicInput.value)
  topicInput.value = ''
}

function addTopicValue(value) {
  const topic = String(value || '').trim().replace(/^#/, '')
  if (!topic) return
  if (!form.topics.includes(topic) && form.topics.length < 8) {
    form.topics.push(topic)
  }
}

function removeTopic(topic) {
  form.topics = form.topics.filter(item => item !== topic)
}

function appendPrompt(prompt) {
  const next = form.content
    ? `${form.content.trimEnd()}\n${prompt}`
    : prompt
  form.content = next.slice(0, 1000)
}

function buildPayload() {
  return {
    title: form.title.trim(),
    content: form.content.trim(),
    images: [...uploadedImages.value],
    coffeeName: form.coffeeName.trim() || null,
    coffeeBrand: form.coffeeBrand.trim() || null,
    location: form.location.trim() || null,
    topics: [...form.topics]
  }
}

/* -------- 提交帖子 -------- */
async function handleSubmit() {
  errors.title = !form.title.trim() ? '请输入标题' : ''
  if (errors.title) return
  serverError.value = ''

  submitting.value = true
  try {
    const payload = buildPayload()

    const res = await coffeeApi.createPost(payload)
    if (res && res.code === 200) {
      clearDraft()
      toast.show('发布成功！')
      if (props.embedded) {
        emit('success', res.data)
      } else {
        router.push('/')
      }
    } else {
      serverError.value = res?.msg || '发布失败'
    }
  } catch (e) {
    serverError.value = getApiError(e)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.wc-create-page {
  position: relative;
  background:
    radial-gradient(circle at 16% 0%, rgba(238, 194, 123, 0.18), transparent 28%),
    radial-gradient(circle at 88% 10%, rgba(141, 110, 99, 0.11), transparent 24%),
    var(--bg-primary);
}
.wc-create-page.is-embedded {
  min-height: auto;
  padding-bottom: 0;
  background: transparent;
}
.wc-create-page.is-embedded::before {
  display: none;
}
.wc-create-page.is-embedded .wc-create-main {
  max-width: none;
  padding: 0;
  padding-top: 0;
}
.wc-create-page.is-embedded .wc-create-layout {
  display: block;
}
.wc-create-page.is-embedded .wc-create-card {
  border: 0;
  border-radius: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}
.wc-create-page.is-embedded .wc-create-card-head {
  padding-bottom: 14px;
  margin-bottom: 16px;
}
.wc-create-page.is-embedded .wc-create-card-head h2 {
  font-size: 24px;
}
.wc-create-page.is-embedded .wc-create-rail {
  display: none;
}
.wc-create-page.is-embedded .wc-create-section {
  margin-top: 18px;
}
.wc-create-page.is-embedded .wc-create-submit {
  min-height: 46px;
  margin-top: 18px;
}
.wc-create-page::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: .32;
  background-image:
    linear-gradient(rgba(109, 76, 65, .035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(109, 76, 65, .035) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(to bottom, rgba(0,0,0,.55), transparent 64%);
}
.wc-create-header {
  background: color-mix(in srgb, var(--bg-elevated) 82%, transparent);
  border-bottom: 1px solid var(--divider);
  box-shadow: 0 10px 28px rgba(62, 39, 35, .055);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
.wc-create-main {
  position: relative;
  z-index: 1;
}
.wc-create-icon-btn {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg-secondary) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 62%, transparent);
}
.wc-create-icon-btn:hover {
  background: var(--bg-elevated);
}
.wc-create-top-submit {
  min-height: 36px;
  padding: 0 16px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: linear-gradient(135deg, #8D5A3B, #3E2723);
  color: #FFF8E1;
  font-size: 12.5px;
  font-weight: 800;
  box-shadow: 0 10px 22px rgba(109, 76, 65, .22);
}
.wc-create-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}
@media (min-width: 1024px) {
  .wc-create-layout {
    grid-template-columns: minmax(0, 740px) 280px;
    justify-content: center;
    gap: 28px;
  }
}
.wc-create-card,
.wc-create-rail-card,
.wc-create-hero-card {
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: color-mix(in srgb, var(--bg-elevated) 86%, transparent);
  box-shadow: 0 16px 44px rgba(62, 39, 35, .07);
  backdrop-filter: blur(14px);
}
.wc-create-card {
  border-radius: 30px;
  padding: 22px;
}
@media (min-width: 640px) {
  .wc-create-card {
    padding: 28px;
  }
}
.wc-create-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 20px;
  margin-bottom: 22px;
  border-bottom: 1px solid var(--divider);
}
.wc-create-eyebrow {
  margin-bottom: 6px;
  color: #9A6346;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .16em;
}
.wc-create-card-head h2 {
  color: var(--text-primary);
  font-size: clamp(22px, 3vw, 30px);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.12;
}
.wc-create-draft-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  color: var(--text-muted);
  background: color-mix(in srgb, var(--bg-secondary) 62%, transparent);
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}
.wc-create-draft-pill.is-active {
  color: #8A5A33;
  background: rgba(238, 194, 123, .24);
}
.wc-create-section {
  margin-top: 22px;
}
.wc-create-section:first-of-type {
  margin-top: 0;
}
.wc-create-label {
  display: block;
  margin-bottom: 8px;
  padding-left: 4px;
  color: var(--text-secondary);
  font-size: 13.5px;
  font-weight: 800;
}
.wc-create-label span {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
}
.wc-create-textarea {
  min-height: 168px;
  line-height: 1.7;
}
.wc-upload-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
@media (min-width: 520px) {
  .wc-upload-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
.wc-upload-item,
.wc-upload-add {
  aspect-ratio: 1 / 1;
  border-radius: 20px;
  overflow: hidden;
}
.wc-upload-item {
  position: relative;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  box-shadow: 0 8px 18px rgba(62, 39, 35, .055);
}
.wc-upload-remove {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(44, 24, 16, .58);
  opacity: 0;
  transition: opacity .2s ease;
}
.wc-upload-item:hover .wc-upload-remove {
  opacity: 1;
}
.wc-upload-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text-muted);
  background: color-mix(in srgb, var(--bg-secondary) 66%, transparent);
  border: 1.5px dashed color-mix(in srgb, var(--coffee-brown) 28%, var(--border));
  font-size: 11.5px;
  font-weight: 800;
}
.wc-upload-add:hover {
  color: var(--text-primary);
  background: color-mix(in srgb, var(--accent-cream) 48%, transparent);
}
.wc-create-topic,
.wc-create-suggest {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  color: #7A4A33;
  background: rgba(238, 194, 123, .22);
  font-size: 12px;
  font-weight: 800;
}
.wc-create-suggest {
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--bg-secondary) 66%, transparent);
}
.wc-create-suggest:hover {
  background: rgba(238, 194, 123, .30);
}
.wc-create-secondary-btn {
  padding: 0 16px;
  border-radius: 18px;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--bg-secondary) 72%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  font-size: 13px;
  font-weight: 800;
}
.wc-create-draft-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8A5A33;
  background: rgba(238, 194, 123, .18);
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  padding: 10px 12px;
  border-radius: 18px;
  font-size: 12px;
}
.wc-create-submit {
  width: 100%;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  border-radius: 20px;
  background: linear-gradient(135deg, #8D5A3B, #3E2723);
  color: #FFF8E1;
  font-size: 15px;
  font-weight: 900;
  box-shadow: 0 14px 28px rgba(109, 76, 65, .24);
  transition: transform .15s var(--ease-smooth), box-shadow .2s var(--ease-smooth), opacity .2s ease;
}
.wc-create-submit:hover {
  box-shadow: 0 16px 34px rgba(109, 76, 65, .30);
}
.wc-create-submit:disabled,
.wc-create-top-submit:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.wc-create-rail {
  display: none;
}
@media (min-width: 1024px) {
  .wc-create-rail {
    display: block;
    position: sticky;
    top: 88px;
  }
}
.wc-create-hero-card,
.wc-create-rail-card {
  border-radius: 26px;
  padding: 18px;
}
.wc-create-rail-card {
  margin-top: 14px;
}
.wc-create-hero-icon {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  border-radius: 17px;
  color: #FFF8E1;
  background: linear-gradient(135deg, #A66A43, #3E2723);
  box-shadow: 0 10px 22px rgba(109, 76, 65, .22);
}
.wc-create-hero-card h3,
.wc-create-rail-card h4 {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 900;
}
.wc-create-hero-card p {
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 12.5px;
  line-height: 1.7;
}
.wc-create-rail-card ul {
  display: grid;
  gap: 9px;
  margin-top: 12px;
}
.wc-create-rail-card li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 12.5px;
  font-weight: 700;
}
.wc-create-rail-card li.is-done {
  color: #7A4A33;
}
.wc-create-prompt {
  width: 100%;
  padding: 10px 11px;
  border-radius: 16px;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--bg-secondary) 62%, transparent);
  text-align: left;
  font-size: 12px;
  line-height: 1.5;
}
.wc-create-prompt:hover {
  background: color-mix(in srgb, var(--accent-cream) 58%, transparent);
}
:root.dark .wc-create-page {
  background:
    radial-gradient(circle at 10% 0%, rgba(238, 194, 123, 0.09), transparent 30%),
    radial-gradient(circle at 92% 6%, rgba(215, 204, 200, 0.08), transparent 24%),
    var(--bg-primary);
}
:root.dark .wc-create-topic,
:root.dark .wc-create-draft-pill.is-active,
:root.dark .wc-create-rail-card li.is-done {
  color: #F5E6D3;
}
</style>
