<script setup lang="ts">
import { usePreferredDark } from '@vueuse/core'
import { darkTheme, NConfigProvider, NDialogProvider, NPopover } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { computed, onBeforeMount, watch } from 'vue'

import PopoverContent from '@/components/PopoverContent.vue'
import { get_bangumi_data_from_ipns_list } from '@/request'
import { useMainStore } from '@/stores/mainStore'
import { useSettingStore } from '@/stores/settingStore'

const is_dark = usePreferredDark()

const mainStore = useMainStore()
const { data_from_ipfsio, bangumi_source_ipns_list } = storeToRefs(mainStore)

const settingStore = useSettingStore()
const { trusted_source_ipns_list } = storeToRefs(settingStore)

const ipfs_io_url_list = computed<string[]>(() => [
    ...new Set(
        [
            ...bangumi_source_ipns_list.value,
            ...trusted_source_ipns_list.value,
        ].map(
            v =>
                `https://ipfs.io/ipns/${v}${window.location.pathname.split('/').at(-1)}`
        )
    ),
])

async function update_data() {
    data_from_ipfsio.value = await get_bangumi_data_from_ipns_list(
        ipfs_io_url_list.value
    )
}
watch(ipfs_io_url_list, update_data)
onBeforeMount(update_data)
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
                    <PopoverContent :ipfs_io_url_list="ipfs_io_url_list" />
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
.n-input__input-el,
.n-input__textarea-el {
    box-shadow: none !important;
    background-color: transparent !important;
}
</style>
