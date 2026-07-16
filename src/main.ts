import { createApp } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import router from './router'
import './style.css'
import App from './App.vue'

const shouldMock = import.meta.env.DEV && import.meta.env.USE_MOCK === 'true'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    },
  },
})

async function bootstrap() {
  if (shouldMock) {
    const { worker } = await import('./mocks/browser')
    await worker.start()
  }

  createApp(App).use(router).use(VueQueryPlugin, { queryClient }).mount('#app')
}

bootstrap()
