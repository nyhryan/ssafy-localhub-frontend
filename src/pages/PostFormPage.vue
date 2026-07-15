<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createPost, getPostById, getPostCategories, updatePost, verifyPostPassword } from '../services/localhubApi'
import type { PostCategory } from '../types/api'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => route.name === 'post-edit')
const id = computed(() => Number(route.params.id))
const categories = getPostCategories()
const loading = ref(false)

const form = reactive({
  category_name: '관광지' as PostCategory,
  title: '',
  content: '',
  author: '',
  password: '',
})

onMounted(async () => {
  if (!isEdit.value) return

  const post = await getPostById(id.value)
  if (!post) {
    await router.replace('/posts')
    return
  }

  form.category_name = post.category_name
  form.title = post.title
  form.content = post.content
  form.author = post.author
})

const submit = async () => {
  loading.value = true

  try {
    if (isEdit.value) {
      const verified = await verifyPostPassword(id.value, form.password)
      if (!verified) {
        throw new Error('비밀번호가 일치하지 않습니다.')
      }

      await updatePost(id.value, { ...form })
      await router.push(`/posts/${id.value}`)
      return
    }

    const created = await createPost({ ...form })
    await router.push(`/posts/${created.id}`)
  } catch (error) {
    alert(error instanceof Error ? error.message : '저장에 실패했습니다.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="page">
    <section class="form-card">
      <div class="section-head">
        <div>
          <h2>{{ isEdit ? '게시글 수정' : '게시글 작성' }}</h2>
          <p class="section-desc">익명 게시판 방식에 맞춰 제목, 내용, 작성자, 비밀번호를 입력합니다.</p>
        </div>
      </div>

      <form class="form-grid" style="margin-top: 18px" @submit.prevent="submit">
        <label class="field-group">
          <span>카테고리</span>
          <select v-model="form.category_name" class="form-field">
            <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>

        <label class="field-group">
          <span>제목</span>
          <input v-model="form.title" class="form-field" type="text" placeholder="제목을 입력하세요" />
        </label>

        <label class="field-group">
          <span>내용</span>
          <textarea v-model="form.content" class="form-field" placeholder="내용을 입력하세요" />
        </label>

        <label class="field-group">
          <span>작성자</span>
          <input v-model="form.author" class="form-field" type="text" placeholder="닉네임 또는 작성자" />
        </label>

        <label class="field-group">
          <span>{{ isEdit ? '수정 확인 비밀번호' : '비밀번호' }}</span>
          <input v-model="form.password" class="form-field" type="password" placeholder="비밀번호를 입력하세요" />
        </label>

        <div class="form-actions">
          <button class="button" :disabled="loading" type="submit">{{ loading ? '처리 중...' : isEdit ? '수정 완료' : '등록하기' }}</button>
          <RouterLink class="button-ghost" :to="`/posts/${id}`">취소</RouterLink>
        </div>
      </form>
    </section>
  </main>
</template>