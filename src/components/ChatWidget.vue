<script setup lang="ts">
import { ref } from 'vue'
import { chatRespond } from '../services/localhubApi'

type ChatMessage = { role: 'user' | 'assistant'; text: string }

const open = ref(false)
const input = ref('서울에서 이번 주말 축제 추천해줘')
const isSending = ref(false)
const messages = ref<ChatMessage[]>([
  { role: 'assistant', text: '챗봇을 열어 질문해보세요. 관광지, 축제, 맛집, 게시글 검색을 도와드릴게요.' },
])

const toggle = () => {
  open.value = !open.value
}

const send = async () => {
  const text = input.value.trim()
  if (!text || isSending.value) return

  messages.value.push({ role: 'user', text })
  input.value = ''
  isSending.value = true

  try {
    const { response } = await chatRespond(text)
    messages.value.push({
      role: 'assistant',
      text: response ?? '응답이 비어 있습니다.',
    })
  } catch {
    messages.value.push({
      role: 'assistant',
      text: '챗봇 응답을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.',
    })
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <button type="button" class="floating-chat-button" @click="toggle">챗봇</button>

  <div v-if="open" class="floating-chat">
    <section class="chat-panel">
      <div class="section-head">
        <div>
          <h3>LocalHub 챗봇</h3>
          <p class="section-desc">자연어로 관광지, 맛집, 축제를 찾아보세요.</p>
        </div>
        <button type="button" class="button-ghost" @click="toggle">닫기</button>
      </div>

      <div class="chat-history" style="max-height: 360px; overflow: auto; margin-top: 16px">
        <article v-for="(message, index) in messages" :key="index" class="message" :class="message.role">
          <p class="message-text">{{ message.text }}</p>
        </article>
      </div>

      <form class="chat-input" style="margin-top: 14px" @submit.prevent="send">
        <textarea v-model="input" rows="3" placeholder="예: 광주 맛집 추천해줘" :disabled="isSending"></textarea>
        <button type="submit" class="button" style="width: 100%" :disabled="isSending">
          {{ isSending ? '응답을 기다리는 중...' : '전송' }}
        </button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.message-text {
  white-space: pre-line;
}
</style>