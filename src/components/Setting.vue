<script setup lang="ts">
import { NButton, NFlex, NInput, NSpace, NText } from 'naive-ui'

import { storeToRefs } from 'pinia'

import { IPNS_ADDRESS_LIST } from '@/global_val'
import { useSettingStore } from '@/stores/settingStore'
import { onBeforeMount, ref } from 'vue'

const settingStore = useSettingStore()
const { trusted_source } = storeToRefs(settingStore)

const input_trusted_source = ref<string>('')

/**写入变量 */
function save() {
    trusted_source.value = input_trusted_source.value
}
/**还原变量 */
function cancel() {
    if (trusted_source.value !== undefined)
        input_trusted_source.value = trusted_source.value
}
onBeforeMount(cancel)
</script>

<template>
    <n-space vertical style="min-width: calc(min(60em, 70vw))">
        <n-space vertical>
            <n-text>添加额外信任源</n-text>
            <n-input
                type="textarea"
                :placeholder="`每条一行，# 开头为注释\ne.g.\nipns://${IPNS_ADDRESS_LIST[0]}`"
                v-model:value="input_trusted_source"
                :rows="5"
            />
        </n-space>

        <n-flex justify="flex-end" align="center" :wrap="false">
            <n-button type="success" secondary @click="save">保存</n-button>
            <n-button secondary @click="cancel">取消</n-button>
        </n-flex>
    </n-space>
</template>
