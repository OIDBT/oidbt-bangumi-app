<script setup lang="ts">
import { Settings28Regular } from '@vicons/fluent'
import {
    NButton,
    NFlex,
    NIcon,
    NInput,
    NPopover,
    NSpace,
    NSwitch,
    NText,
    NTooltip,
} from 'naive-ui'
import { storeToRefs } from 'pinia'
import { onBeforeMount, ref } from 'vue'

import { BANGUMI_SOURCE_URL } from '@/global_val'
import { useMainStore } from '@/stores/mainStore'
import { useSettingStore } from '@/stores/settingStore'

const mainStore = useMainStore()
const { bangumi_source_ipns_list } = storeToRefs(mainStore)

const settingStore = useSettingStore()
const { helia_enable, trusted_source, trusted_source_gate_list } =
    storeToRefs(settingStore)

const input_helia_enable = ref<boolean>(true)
const input_trusted_source = ref<string>('')

/**写入变量 */
function save() {
    helia_enable.value = input_helia_enable.value
    trusted_source.value = input_trusted_source.value
}
/**还原变量 */
function cancel() {
    if (helia_enable.value !== undefined)
        input_helia_enable.value = helia_enable.value
    if (trusted_source.value !== undefined)
        input_trusted_source.value = trusted_source.value
}
onBeforeMount(cancel)
</script>

<template>
    <n-tooltip trigger="hover" :delay="1500">
        <template #trigger>
            <n-popover trigger="click" placement="bottom-end">
                <template #trigger>
                    <n-button circle>
                        <n-icon><Settings28Regular /></n-icon>
                    </n-button>
                </template>
                <n-space vertical style="min-width: calc(min(60em, 70vw))">
                    <n-switch v-model:value="input_helia_enable">
                        <template #checked>启用 Helia</template>
                        <template #unchecked>禁用 Helia</template>
                    </n-switch>

                    <n-space vertical>
                        <n-text>添加额外信任源</n-text>
                        <n-input
                            type="textarea"
                            :placeholder="`每条一行，# 开头为注释\ne.g.\nipns://${bangumi_source_ipns_list[0]}\ntext://${BANGUMI_SOURCE_URL}\ngate://${trusted_source_gate_list[0]}`"
                            v-model:value="input_trusted_source"
                            :rows="5"
                        />
                    </n-space>

                    <n-flex justify="flex-end" align="center" :wrap="false">
                        <n-button type="success" secondary @click="save">
                            保存
                        </n-button>
                        <n-button secondary @click="cancel">取消</n-button>
                    </n-flex>
                </n-space>
            </n-popover>
        </template>
        <span style="user-select: none">设置</span>
    </n-tooltip>
</template>
