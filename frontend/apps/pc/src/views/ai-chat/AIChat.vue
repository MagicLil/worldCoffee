<template>
  <div class="h-screen flex flex-col bg-surface relative overflow-hidden">
    <!-- Header -->
    <header class="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg border-b border-line/30">
      <div class="max-w-2xl mx-auto px-4 h-12 flex items-center gap-3">
        <button class="p-1.5 rounded-lg hover:bg-surface-soft transition-colors" @click="router.push('/messages')" aria-label="返回消息列表">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-sm font-semibold text-ink truncate">{{ currentTitle }}</h1>
        </div>
        <button class="p-1.5 rounded-lg hover:bg-surface-soft transition-colors" @click="startNewChat" aria-label="新对话" title="新对话">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14m-7-7h14"/></svg>
        </button>
        <button class="p-1.5 rounded-lg hover:bg-surface-soft transition-colors" @click="historyOpen = !historyOpen" aria-label="历史记录">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </button>
      </div>
    </header>

    <!-- Messages -->
    <main ref="scrollRef" class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <div v-for="(msg, i) in messages" :key="i" class="flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
        <div class="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed" :class="msg.role === 'user' ? 'bg-coffee-brown text-white rounded-br-sm' : 'bg-surface-soft text-ink rounded-bl-sm'">
          <span v-if="!msg.streaming">{{ msg.content }}</span>
          <span v-else>{{ msg.content }}<span class="animate-pulse">▍</span></span>
        </div>
      </div>
      <div v-if="messages.length === 0 && !isLoading" class="text-center py-16">
        <p class="text-sm text-ink-muted">问点什么吧 ☕</p>
      </div>
    </main>

    <!-- Input -->
    <div class="border-t border-line/30 bg-surface px-4 py-3">
      <div class="max-w-2xl mx-auto flex items-end gap-2">
        <textarea v-model="inputText" rows="1" class="flex-1 resize-none rounded-2xl bg-surface-soft px-4 py-2.5 text-sm outline-none" placeholder="输入消息..." @keydown.enter.exact.prevent="handleSend"></textarea>
        <button @click="handleSend" class="shrink-0 px-5 py-2.5 rounded-2xl bg-coffee-brown text-white text-sm font-semibold" :disabled="!canSend || isLoading">
          {{ isLoading ? '...' : '发送' }}
        </button>
      </div>
    </div>

    <!-- History sidebar -->
    <transition name="fade">
      <div v-if="historyOpen" class="fixed inset-0 z-30 flex">
        <div class="absolute inset-0 bg-black/40" @click="historyOpen = false"></div>
        <div class="relative ml-auto w-[86%] max-w-sm bg-surface shadow-2xl border-l border-line/60 flex flex-col">
          <div class="px-4 h-14 flex items-center justify-between border-b border-line/60">
            <span class="text-sm font-semibold text-ink">历史记录</span>
            <button class="text-xs text-ink-muted hover:text-ink" @click="historyOpen = false">关闭</button>
          </div>
          <div class="flex-1 overflow-y-auto">
            <div v-if="conversations.length === 0" class="text-center py-10 text-sm text-ink-muted">暂无历史记录</div>
            <div v-else>
              <div v-for="conv in conversations" :key="conv.chatId || conv.id" class="flex items-start gap-3 px-4 py-3 border-b border-line/40 hover:bg-surface-soft cursor-pointer" @click="switchConversation(conv)">
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-ink truncate">{{ conv.title || '新对话' }}</div>
                  <div class="text-xs text-ink-muted mt-1">{{ conv.updatedAt || conv.createdAt }}</div>
                </div>
                <button @click.stop="deleteConv(conv)" class="p-1 rounded hover:bg-red-500/10 text-ink-muted hover:text-red-500" title="删除">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { aiApi } from '@wc/shared'

const router = useRouter()
const scrollRef = ref(null)
const inputText = ref('')
const isLoading = ref(false)
const messages = ref([])
const conversations = ref([])
const currentChatId = ref(null)
const historyOpen = ref(false)

const canSend = computed(() => inputText.value.trim().length > 0 && !isLoading.value)
const currentTitle = computed(() => {
  if (!currentChatId.value) return 'worldCoffee 助手'
  const conv = conversations.value.find(c => (c.chatId || c.id) === currentChatId.value)
  return (conv && conv.title) || '新对话'
})

function startNewChat() {
  currentChatId.value = null;
  messages.value = [];
  inputText.value = '';
}

function scrollToBottom() {
  nextTick(() => { if (scrollRef.value) scrollRef.value.scrollTop = scrollRef.value.scrollHeight })
}

async function loadConversations() {
  try {
    const list = await aiApi.listConversations()
    conversations.value = Array.isArray(list) ? list : []
  } catch (e) {
    console.error('加载对话列表失败', e)
  }
}

async function switchConversation(conv) {
  historyOpen.value = false
  currentChatId.value = conv.chatId || conv.id
  try {
    const res = await aiApi.getConversationMessages(currentChatId.value)
    messages.value = Array.isArray(res) ? res.map(m => ({ role: m.role, content: m.content })) : []
    scrollToBottom()
  } catch (e) {
    console.error('加载消息失败', e)
    messages.value = [{ role: 'assistant', content: '加载历史消息失败，请重试' }]
  }
}

async function deleteConv(conv) {
  const chatId = conv && (conv.chatId || conv.id)
  if (!chatId) return
  try {
    const ok = await aiApi.deleteConversation(chatId)
    if (ok) {
      conversations.value = conversations.value.filter(c => (c.chatId || c.id) !== chatId)
      if (currentChatId.value === chatId) {
        currentChatId.value = null
        messages.value = []
      }
    }
    await loadConversations()
  } catch (e) {
    console.error('删除对话失败', e)
  }
}

function handleSend() {
  const msg = inputText.value.trim()
  if (!msg || isLoading.value) return
  inputText.value = ''
  messages.value.push({ role: 'user', content: msg })
  messages.value.push({ role: 'assistant', content: '', streaming: true })
  isLoading.value = true
  scrollToBottom()

  const userMsg = msg
  const chatId = currentChatId.value || 'chat_' + Date.now()
  if (!currentChatId.value) currentChatId.value = chatId

  aiApi.chat(userMsg, {
    chatId: chatId,
    onMessage: (chunk) => {
      const last = messages.value[messages.value.length - 1]
      if (last && last.streaming) last.content += chunk
      scrollToBottom()
    },
    onEnd: async () => {
      const last = messages.value[messages.value.length - 1]
      if (last) last.streaming = false
      isLoading.value = false
      scrollToBottom()
      await loadConversations()
    },
    onError: (err) => {
      const last = messages.value[messages.value.length - 1]
      if (last) { last.streaming = false; last.content = last.content || '出错了: ' + err }
      isLoading.value = false
    }
  })
}

onMounted(async () => {
  try {
    await loadConversations()
    if (conversations.value.length > 0) {
      const latest = conversations.value[0]
      currentChatId.value = latest.chatId || latest.id
      const res = await aiApi.getConversationMessages(currentChatId.value)
      messages.value = Array.isArray(res) ? res.map(m => ({ role: m.role, content: m.content })) : []
    }
  } catch (e) {
    console.error('初始化 AI 对话失败', e)
  }
})
</script>

<style scoped>
.fade-enter-active,.fade-leave-active{transition:opacity .2s}.fade-enter-from,.fade-leave-to{opacity:0}
</style>
