import { BANGUMI_SOURCE_URL, DEFAULT_IPNS_ADDRESS_LIST } from '@/global_val'
import { log } from '@/log'
import { get_trusted_source_list_from_head } from '@/utils'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Magnet_item {
    magnet: string
    source_link_set: string[]
    title_set: string[]
    cid: string
}

export interface Oidbt_ipfs_bangumi {
    update_time: string
    magnet_list: Magnet_item[]
}

export const useMainStore = defineStore('main', () => {
    const data_from_ipfsio = ref<Oidbt_ipfs_bangumi | null | undefined>(
        undefined
    )

    const bangumi_source_ipns_list = ref<string[]>(DEFAULT_IPNS_ADDRESS_LIST)
    fetch(BANGUMI_SOURCE_URL)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP status: ${response.status}`)
            return response.text()
        })
        .then(data => {
            const lines: string[] = get_trusted_source_list_from_head(
                data
                    .split(/\r?\n|\r/)
                    .map(line => (line.endsWith('/') ? line : line + '/')),
                'ipns://'
            )
            log.debug('bangumi source list', lines)
            bangumi_source_ipns_list.value = [
                ...new Set([...bangumi_source_ipns_list.value, ...lines]),
            ]
        })
        .catch(e => log.error('获取 bangumi source list 失败', e))

    return {
        data_from_ipfsio,
        bangumi_source_ipns_list,
    }
})
