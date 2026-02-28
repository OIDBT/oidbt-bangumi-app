<script setup lang="tsx">
import { CopyLink } from '@vicons/carbon'
import { CloudLink20Regular, Info20Regular } from '@vicons/fluent'
import { MagnetOutline } from '@vicons/ionicons5'
import {
    NA,
    NButton,
    NDataTable,
    NFlex,
    NIcon,
    NInput,
    NPopover,
    NSpace,
    NSpin,
    NTag,
    NText,
    NTooltip,
    type DataTableColumns,
} from 'naive-ui'
import { storeToRefs } from 'pinia'
import { computed, ref, type StyleValue } from 'vue'

import { useMainStore } from '@/stores/mainStore'

const mainStore = useMainStore()
const { data_from_ipfsio } = storeToRefs(mainStore)

const wd = window
const nav = navigator

const props = defineProps<{
    ipfs_io_url: string
}>()

interface Data_table_row {
    num: number
    title: string
    magnet: string

    // 源数据引用
    source_link_set: string[]
    title_set: string[]
}

const data_table_data = computed<Data_table_row[]>(
    () =>
        data_from_ipfsio.value?.magnet_list.map<Data_table_row>(
            ({ magnet, source_link_set, title_set }, i) => ({
                num: i + 1,
                title: title_set[0] || '',
                magnet: magnet,
                source_link_set: source_link_set,
                title_set: title_set,
            })
        ) || []
)

const filte_str = ref<string>('')
const filte_reg = computed<RegExp>(() => new RegExp(filte_str.value))

const num_tag_width = computed(() =>
    data_table_data.value
        ? `${data_table_data.value.length.toString().length}em`
        : 'auto'
)

// 定义列
const styles: Record<string, StyleValue> = {
    noselect: { userSelect: 'none' },
}
const data_table_columns = computed<DataTableColumns<Data_table_row>>(() => [
    {
        type: 'selection',
        fixed: 'left',
    },
    {
        title: '',
        key: 'num',
        fixed: 'left',
        width: `calc(${num_tag_width.value} + 15.6px)`,
        sorter: 'default',
        render(row) {
            return (
                <NTag
                    style={{
                        width: num_tag_width.value,
                        justifyContent: 'space-around',
                    }}
                >
                    {row.num}
                </NTag>
            )
        },
    },
    {
        title: '标题',
        key: 'title',
        sorter: 'default',
        filterOptionValue: 0,
        filter(value, row) {
            if (!filte_str.value) return true
            return filte_reg.value.test(row.title)
        },
    },
    {
        title: '',
        key: 'magnet',
        fixed: 'right',
        width: 160,
        render(row) {
            return (
                <NSpace align="center" wrap={false}>
                    <NTooltip
                        trigger="hover"
                        keep-alive-on-hover={false}
                        delay={1500}
                    >
                        {{
                            trigger: () => (
                                <NButton
                                    circle
                                    onClick={() =>
                                        nav.clipboard.writeText(row.magnet)
                                    }
                                >
                                    <NIcon>
                                        <CopyLink />
                                    </NIcon>
                                </NButton>
                            ),
                            default: () => (
                                <span style={styles.noselect}>复制磁链</span>
                            ),
                        }}
                    </NTooltip>
                    <NTooltip
                        trigger="hover"
                        keep-alive-on-hover={false}
                        delay={1500}
                    >
                        {{
                            trigger: () => (
                                <a href={row.magnet}>
                                    <NButton circle>
                                        <NIcon>
                                            <MagnetOutline />
                                        </NIcon>
                                    </NButton>
                                </a>
                            ),
                            default: () => (
                                <span style={styles.noselect}>打开磁链</span>
                            ),
                        }}
                    </NTooltip>
                    <NPopover
                        trigger="click"
                        placement="bottom-end"
                        delay={1500}
                    >
                        {{
                            trigger: () => (
                                <NTooltip
                                    trigger="hover"
                                    keep-alive-on-hover={false}
                                    placement="top"
                                    delay={1500}
                                >
                                    {{
                                        trigger: () => (
                                            <NButton circle>
                                                <NIcon>
                                                    <Info20Regular />
                                                </NIcon>
                                            </NButton>
                                        ),
                                        default: () => (
                                            <span style={styles.noselect}>
                                                详细信息
                                            </span>
                                        ),
                                    }}
                                </NTooltip>
                            ),
                            default: () => (
                                <NSpace vertical>
                                    <NA {...({ href: row.magnet } as any)}>
                                        {row.magnet}
                                    </NA>
                                    {row.title_set.map(title => (
                                        <NText>{title}</NText>
                                    ))}
                                    {row.source_link_set.map(link => (
                                        <NA {...({ href: link } as any)}>
                                            {link}
                                        </NA>
                                    ))}
                                </NSpace>
                            ),
                        }}
                    </NPopover>
                </NSpace>
            )
        },
    },
])

// 所选行
const checked_row_keys = ref<number[]>([])
</script>

<template>
    <n-spin
        style="padding: 2rem"
        v-if="data_from_ipfsio === undefined"
    ></n-spin>
    <n-space
        align="center"
        style="padding: 0.8rem 1.6rem"
        v-else-if="data_from_ipfsio === null"
    >
        <n-text type="error">获取失败</n-text>
        <n-tooltip trigger="hover" :delay="1500">
            <template #trigger>
                <a :href="ipfs_io_url" target="_blank">
                    <n-button circle>
                        <n-icon><CloudLink20Regular /></n-icon>
                    </n-button>
                </a>
            </template>
            从公共网关打开
        </n-tooltip>
    </n-space>
    <div v-else>
        <div style="padding-top: 12px">
            <n-flex
                align="center"
                justify="space-between"
                :wrap="false"
                style="margin: 0 20px 12px"
            >
                <n-input
                    v-model:value="filte_str"
                    type="text"
                    placeholder="过滤"
                />
                <n-tooltip trigger="hover" :delay="1500">
                    <template #trigger>
                        <n-button
                            circle
                            @click="
                                nav.clipboard.writeText(
                                    data_table_data
                                        .filter(d =>
                                            checked_row_keys.includes(d.num)
                                        )
                                        .map(d => d.magnet)
                                        .join('\n')
                                )
                            "
                        >
                            <n-icon><CopyLink /></n-icon>
                        </n-button>
                    </template>
                    <span :style="styles.noselect">复制所选磁链</span>
                </n-tooltip>
            </n-flex>
        </div>
        <n-data-table
            :columns="data_table_columns"
            :data="data_table_data"
            :row-key="row => (row as Data_table_row).num"
            :virtual-scroll="true"
            v-model:checked-row-keys="checked_row_keys"
            max-height="calc(90vh - 136px - 24px - 2rem)"
        />
    </div>
</template>
