<script setup lang="ts">
import PopoverContent from '@/components/PopoverContent.vue'
import { IPNS_ADDRESS, ROOT_PATH } from '@/global_val'
import { log } from '@/log'
import { useMainStore, type Oidbt_ipfs_bangumi } from '@/stores/mainStore'
import { NPopover } from 'naive-ui'
import { onBeforeMount } from 'vue'

import { dezstd } from '@/utils'
import { storeToRefs } from 'pinia'

const mainStore = useMainStore()
const { data_from_ipfsio } = storeToRefs(mainStore)

const url = `${IPNS_ADDRESS}/${ROOT_PATH}/bangumi/${window.location.pathname.split('/').at(-1)}`
const ipfs_io_url = `https://ipfs.io/ipns/${url}`

onBeforeMount(async () => {
    try {
        log.debug(url)

        const response = await fetch(ipfs_io_url, {
            signal: new AbortController().signal,
        })

        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`)
        }

        log.debug('获取 IPNS 内容:', response)

        const compressedBuffer = await response.arrayBuffer()
        log.debug('获取到压缩数据，大小:', compressedBuffer.byteLength, 'bytes')

        const decompressedBuffer = await dezstd(
            new Uint8Array(compressedBuffer)
        )
        log.debug('解压完成，大小:', decompressedBuffer.byteLength, 'bytes')

        data_from_ipfsio.value = JSON.parse(
            new TextDecoder().decode(decompressedBuffer)
        ) as Oidbt_ipfs_bangumi
        log.debug('解码数据:', data_from_ipfsio.value)
    } catch (error) {
        log.error('获取 IPNS 失败:', error)
        data_from_ipfsio.value = null
    }
})
</script>

<template>
    <n-popover
        trigger="click"
        placement="bottom"
        style="
            max-height: calc(90vh - 136px);
            max-width: 70vw;
            overflow-y: auto;
            scrollbar-width: thin;
            padding: 0;
        "
    >
        <template #trigger>
            <a style="cursor: pointer">
                <div>OIDBT</div>
            </a>
        </template>
        <PopoverContent :ipfs_io_url="ipfs_io_url"></PopoverContent>
    </n-popover>
</template>

<style scoped></style>
