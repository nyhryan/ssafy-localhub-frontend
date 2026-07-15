import { createApp } from 'vue'
import router from './router'
import './style.css'
import App from './App.vue'

async function bootstrap() {

    if (import.meta.env.DEV) {

        const { worker } = await import("./mocks/browser")

        await worker.start()

    }

    createApp(App).use(router).mount('#app')
}

bootstrap()


