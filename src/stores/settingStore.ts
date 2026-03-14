import { log } from '@/log'
import { setting_db } from '@/stores/database'
import { get_trusted_source_list_from_head } from '@/utils'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { DEFAULT_GETE_ADDRESS_LIST } from '@/global_val'

export const useSettingStore = defineStore('setting', () => {
    // Helia 设置
    const helia_enable = ref<boolean | undefined>(undefined)
    setting_db
        .get('helia_enable')
        .then(v => {
            helia_enable.value = v?.value ?? true
            watch(helia_enable, async () =>
                setting_db.set('helia_enable', helia_enable.value)
            )
        })
        .catch(e => log.error(e))

    // 可信源设置
    const trusted_source = ref<string>('')
    setting_db
        .get('trusted_source')
        .then(v => {
            trusted_source.value = v?.value ?? ''
            watch(trusted_source, async () =>
                setting_db.set('trusted_source', trusted_source.value)
            )
        })
        .catch(e => log.error(e))

    const trusted_source_lines = computed<string[]>(() =>
        trusted_source.value.split('\n').filter(line => {
            line = line.trim()
            return !(line.length === 0 || line.startsWith('#'))
        })
    )

    /**format: abc.../oidbt_ipfs_root/bangumi/ */
    const trusted_source_ipns_list = ref<string[]>([])
    /**format: https://ipfs.io */
    const trusted_source_gate_list = ref<string[]>([])
    watch(trusted_source_lines, async () => {
        trusted_source_ipns_list.value = [
            ...get_trusted_source_list_from_head(
                trusted_source_lines.value,
                'ipns://'
            ),
            ...(
                await Promise.all(
                    get_trusted_source_list_from_head(
                        trusted_source_lines.value,
                        'text://'
                    ).map(async url => {
                        try {
                            const response = await fetch(url)
                            if (!response.ok)
                                throw new Error(
                                    `状态码错误: ${response.status}`
                                )
                            return response.text()
                        } catch (e) {
                            log.error('请求失败', url, e)
                            return null
                        }
                    })
                )
            ).filter(v => v !== null),
        ]

        trusted_source_gate_list.value = [
            ...DEFAULT_GETE_ADDRESS_LIST,
            ...get_trusted_source_list_from_head(
                trusted_source_lines.value,
                'gate://'
            ),
        ].map(s => (s.endsWith('/') ? s.slice(0, -1) : s))
    })

    return {
        helia_enable,
        trusted_source,
        trusted_source_ipns_list,
        trusted_source_gate_list,
    }
})
