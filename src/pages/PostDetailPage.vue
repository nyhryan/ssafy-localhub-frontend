<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PasswordModal from '../components/PasswordModal.vue'
import { deletePost, getPostById, incrementPostViews, togglePostLike, verifyPostPassword } from '../services/localhubApi'
import type { Post } from '../types/api'
import { Eye, Heart } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const post = ref<Post | null>(null)
const deleteDialog = ref(false)
const loading = ref(true)

// 좋아요 상태 관리용 ref
const isLiked = ref(false)
const STORAGE_KEY = 'localhub-liked-posts'

const id = computed(() => Number(route.params.id))
const viewCount = computed(() => {
  if (!post.value) return 0
  if (typeof post.value.viewCount === 'number') return post.value.viewCount
  return 'views' in post.value && typeof post.value.views === 'number' ? post.value.views : 0
})
const likeCount = computed(() => {
  if (!post.value) return 0
  if (typeof post.value.likeCount === 'number') return post.value.likeCount
  return 'likes' in post.value && typeof post.value.likes === 'number' ? post.value.likes : 0
})

const readLikedIds = (): number[] => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const ids = JSON.parse(raw)
    return Array.isArray(ids) ? ids.filter((likedId): likedId is number => typeof likedId === 'number') : []
  } catch {
    return []
  }
}

const syncLikedStorage = (postId: number, hasLiked: boolean) => {
  const likedIds = readLikedIds()
  const nextIds = hasLiked
    ? Array.from(new Set([...likedIds, postId]))
    : likedIds.filter((likedId) => likedId !== postId)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds))
}

// 초기 로드 시 localStorage에서 좋아요 여부 확인
const checkLikedStatus = () => {
  isLiked.value = readLikedIds().includes(id.value)
}

const load = async () => {
  loading.value = true
  await incrementPostViews(id.value)
  post.value = await getPostById(id.value)
  checkLikedStatus()
  loading.value = false
}

const handleLike = async () => {
  if (!post.value) return

  try {
    const currentLiked = isLiked.value
    const nextLiked = !currentLiked
    const response = await togglePostLike(id.value, currentLiked)

    const nextLikeCount =
      'likes' in response && typeof response.likes === 'number'
        ? response.likes
        : 'likeCount' in response && typeof response.likeCount === 'number'
          ? response.likeCount
          : likeCount.value + (nextLiked ? 1 : -1)

    post.value = {
      ...post.value,
      likeCount: Math.max(0, nextLikeCount),
    }
    isLiked.value = nextLiked
    syncLikedStorage(id.value, nextLiked)
  } catch (error) {
    alert('좋아요 처리에 실패했습니다.')
  }
}

const handleDelete = async (password: string) => {
  try {
    const verified = await verifyPostPassword(id.value, password)
    if (!verified) {
      throw new Error('비밀번호가 일치하지 않습니다.')
    }

    await deletePost(id.value, password)
    await router.push('/posts')
  } catch (error) {
    alert(error instanceof Error ? error.message : '삭제에 실패했습니다.')
  }
}

onMounted(load)
</script>

<template>
  <main class="page" v-if="!loading && post">
    <section class="detail-layout">
      <article class="detail-panel">
        <div class="badge">{{ post.category_name }}</div>
        <h1 class="detail-title" style="margin-top: 12px">{{ post.title }}</h1>
        <p class="meta" style="margin-top: 10px">{{ post.author }} · {{ new Date(post.created_at).toLocaleString('ko-KR') }}</p>

        <div class="toolbar" style="margin-top: 18px; display: flex; gap: 20px; align-items: center;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <Eye :size="18" />
            <span>{{ viewCount }}</span>
          </div>

          <button
            type="button"
            @click="handleLike"
            style="
              display: flex;
              align-items: center;
              gap: 6px;
              background: none;
              border: none;
              cursor: pointer;
              padding: 0;
              color: inherit;
            "
          >
            <Heart
              :size="18"
              :fill="isLiked ? 'currentColor' : 'none'"
              :stroke-width="2"
              :class="{ liked: isLiked }"
            />
            <span>{{ likeCount }}</span>
          </button>
        </div>

        <div class="article" style="margin-top: 22px">
          <p>{{ post.content }}</p>
        </div>

        <div class="card-actions" style="margin-top: 24px">
          <!-- 기존 좋아요 버튼 제거됨 -->
          <RouterLink class="button" :to="`/posts/${post.id}/edit`">수정</RouterLink>
          <button type="button" class="button-danger" @click="deleteDialog = true">삭제</button>
          <RouterLink class="button-ghost" to="/posts">목록으로</RouterLink>
        </div>
      </article>
    </section>

    <PasswordModal
      v-model="deleteDialog"
      title="게시글 삭제"
      description="삭제를 계속하려면 게시글 비밀번호를 입력하세요."
      confirm-label="삭제"
      @confirm="handleDelete"
    />
  </main>
</template>