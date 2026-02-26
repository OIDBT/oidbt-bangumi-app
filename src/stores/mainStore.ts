import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Magnet_item {
    magnet: string
    source_link_set: string[]
    title_set: string[]
}

export interface Oidbt_ipfs_bangumi {
    update_time: string
    magnet_list: Magnet_item[]
}

export const useMainStore = defineStore('main', () => {
    const is_support_sharedworker = Boolean(
        window.SharedWorker && typeof window.SharedWorker === 'function'
    )
    const data_from_ipfsio = ref<Oidbt_ipfs_bangumi | null | undefined>(
        undefined
    )

    return { is_support_sharedworker, data_from_ipfsio }
})
