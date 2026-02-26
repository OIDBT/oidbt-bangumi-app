<script setup lang="ts">
import { useMainStore } from '@/stores/mainStore'
import { CopyLink } from '@vicons/carbon'
import { CloudLink16Regular } from '@vicons/fluent'
import { MagnetOutline } from '@vicons/ionicons5'
import {
    NButton,
    NFlex,
    NIcon,
    NList,
    NListItem,
    NSpace,
    NSpin,
    NText,
    NTooltip,
    NTag,
} from 'naive-ui'
import { storeToRefs } from 'pinia'

const mainStore = useMainStore()
const { data_from_ipfsio } = storeToRefs(mainStore)

const wd = window
const nav = navigator

const props = defineProps<{
    ipfs_io_url: string
}>()
</script>

<template>
    <n-spin style="margin: 2rem" v-if="data_from_ipfsio === undefined"></n-spin>
    <n-space
        align="center"
        style="margin: 0.8rem 1.6rem"
        v-else-if="data_from_ipfsio === null"
    >
        <n-text type="error">获取失败</n-text>
        <n-tooltip trigger="hover" :delay="1500">
            <template #trigger>
                <a :href="ipfs_io_url" target="_blank">
                    <n-button circle>
                        <n-icon><CloudLink16Regular /></n-icon>
                    </n-button>
                </a>
            </template>
            从公共网关打开
        </n-tooltip>
    </n-space>
    <n-list hoverable style="width: 100%; margin-right: 5rem" v-else>
        <n-list-item
            v-for="(
                { magnet, source_link_set, title_set }, i
            ) in data_from_ipfsio.magnet_list.sort((a, b) =>
                (a.title_set[0] || '')
                    .toLowerCase()
                    .localeCompare((b.title_set[0] || '').toLowerCase())
            )"
        >
            <n-flex align="center" justify="space-between" :wrap="false">
                <n-flex align="center" :wrap="false">
                    <n-tag class="num-tag">{{ i + 1 }}</n-tag>
                    <n-text :wrap="false">
                        {{ title_set[0] }}
                    </n-text>
                </n-flex>
                <n-flex align="center" :wrap="false">
                    <n-tooltip trigger="hover" :delay="1500">
                        <template #trigger>
                            <n-button
                                circle
                                @click="nav.clipboard.writeText(magnet)"
                            >
                                <n-icon><CopyLink /></n-icon>
                            </n-button>
                        </template>
                        <span>复制磁链</span>
                    </n-tooltip>
                    <n-tooltip trigger="hover" :delay="1500">
                        <template #trigger>
                            <a :href="magnet">
                                <n-button circle>
                                    <n-icon><MagnetOutline /></n-icon>
                                </n-button>
                            </a>
                        </template>
                        <span>打开磁链</span>
                    </n-tooltip>
                </n-flex>
            </n-flex>
        </n-list-item>
    </n-list>
</template>

<style scoped>
.num-tag {
    width: v-bind(
        'data_from_ipfsio ? `${data_from_ipfsio.magnet_list.length.toString().length}em` : "auto"'
    );
    display: inline-flex;
    justify-content: space-around;
}
</style>
