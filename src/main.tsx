import { log } from '@/log'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'

async function run(): Promise<void> {
    const app = createApp(App)
    app.use(createPinia())

    const target_element = document.querySelector(
        '#headerSubject > .subjectNav ul.navTabs'
    )
    if (target_element === null) return log.error('获取目标元素失败')
    else log.debug('获取目标元素成功')

    const container = document.createElement('li')
    container.id = 'OIDBT'

    app.mount(target_element.appendChild(container))
}

run()
