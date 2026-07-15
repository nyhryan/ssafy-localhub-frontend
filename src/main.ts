import { createApp } from 'vue'
import router from './router'
import './style.css'
import App from './App.vue'

const shouldMock = import.meta.env.DEV && import.meta.env.USE_MOCK === 'true'

async function bootstrap() {

    if (shouldMock) {

        const { worker } = await import("./mocks/browser")

        await worker.start()

    }

    createApp(App).use(router).mount('#app')
}

bootstrap()


