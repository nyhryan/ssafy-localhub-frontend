<script setup lang="ts">
import { ref } from 'vue'
import { chatRespond } from '../services/localhubApi'

type ChatMessage = { role: 'user' | 'assistant'; text: string }

const input = ref('광주 맛집 추천해줘')
const messages = ref<ChatMessage[]>([
  { role: 'assistant', text: 'LocalHub 챗봇입니다. 관광지, 축제, 맛집, 게시글 검색을 도와드릴게요.' },
])

const send = async () => {
  const text = input.value.trim()
  if (!text) return

  messages.value.push({ role: 'user', text })
  input.value = ''
  const response = await chatRespond(text)
  messages.value.push({ role: 'assistant', text: response.response ?? '응답이 비어 있습니다.' })
}
</script>

<template>
  <main class="page">
    <section class="chat-panel">
      <div class="section-head">
        <div>
          <h2>챗봇</h2>
          <p class="section-desc">자연어로 질문하면 추천 목록을 짧게 요약해서 보여줍니다.</p>
        </div>
        <span class="status-pill">Online Mock</span>
      </div>

      <div class="chat-history" style="margin-top: 18px; max-height: 540px; overflow: auto">
        <article v-for="(message, index) in messages" :key="index" class="message" :class="message.role">
          <p style="white-space: pre-line">{{ message.text }}</p>
        </article>
      </div>

      <form class="chat-input" style="margin-top: 14px" @submit.prevent="send">
        <textarea v-model="input" rows="4" placeholder="예: 부산에서 이번 주말 축제 알려줘"></textarea>
        <button type="submit" class="button">전송</button>
      </form>
    </section>
  </main>
</template>