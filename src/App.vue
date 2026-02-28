<script setup lang="ts">
import { usePreferredDark } from '@vueuse/core'
import { darkTheme, NConfigProvider, NDialogProvider, NPopover } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { onBeforeMount } from 'vue'

import PopoverContent from '@/components/PopoverContent.vue'
import { IPNS_ADDRESS, ROOT_PATH } from '@/global_val'
import { log } from '@/log'
import { useMainStore, type Oidbt_ipfs_bangumi } from '@/stores/mainStore'
import { dezstd } from '@/utils'

const is_dark = usePreferredDark()

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
    <a style="cursor: pointer; padding: 0">
        <n-config-provider :theme="is_dark ? darkTheme : null">
            <n-popover
                trigger="click"
                placement="bottom"
                style="padding: 0; max-width: 70vw"
            >
                <template #trigger>
                    <div style="padding: 10px 10px 9px">OIDBT</div>
                </template>
                <n-dialog-provider>
                    <PopoverContent :ipfs_io_url="ipfs_io_url" />
                </n-dialog-provider>
            </n-popover>
        </n-config-provider>
    </a>
</template>

<style scoped>
a:hover span {
    color: rgb(54, 156, 248) !important;
}
html[data-theme='light'] {
    a span {
        color: rgb(136, 136, 136);
    }
}
html[data-theme='dark'] {
    a span {
        color: rgb(238, 238, 238);
    }
}
</style>

<style>
/* Bangumi 的全局 css 会覆盖 input */
.n-input__input-el {
    box-shadow: none !important;
    background-color: transparent !important;
}
</style>
