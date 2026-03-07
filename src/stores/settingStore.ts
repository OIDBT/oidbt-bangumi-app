import { log } from '@/log'
import { setting_store } from '@/store'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export const useSettingStore = defineStore('setting', () => {
    const trusted_source = ref<string>('')
    setting_store
        .get('trusted_source')
        .then(v => {
            trusted_source.value = v?.value ?? ''
            watch(trusted_source, async () =>
                setting_store.set('trusted_source', trusted_source.value)
            )
        })
        .catch(e => log.error(e))
    const trusted_source_lines = computed<string[]>(() =>
        trusted_source.value.split('\n').filter(line => {
            line = line.trim()
            return !(line.length === 0 || line.startsWith('#'))
        })
    )
    function get_trusted_source_list_from_head(head: string) {
        const regex = new RegExp(`^${head}(.+)`)
        return () =>
            trusted_source_lines.value
                .map(line => (line.match(regex) || [])[1] || null)
                .filter(v => v != null)
    }
    const trusted_source_ipns_list = computed<string[]>(
        get_trusted_source_list_from_head('ipns://')
    )

    return { trusted_source, trusted_source_ipns_list }
})
