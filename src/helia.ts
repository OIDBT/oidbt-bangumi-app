import { ipns } from '@helia/ipns'
import { unixfs } from '@helia/unixfs'
import { peerIdFromString } from '@libp2p/peer-id'
import { Buffer } from 'buffer'
import { createHelia, type Helia } from 'helia'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'

import { log } from '@/log'
import { useSettingStore } from '@/stores/settingStore'

export let helia: Helia | null = null

/**启动 Helia 节点*/
export async function start_helia_node() {
    const settingStore = useSettingStore()
    const { helia_enable } = storeToRefs(settingStore)
    if (helia_enable.value === undefined) {
        log.debug('等待 helia_enable 状态初始化...')

        // 创建一个 Promise，等待状态变为非 undefined
        await new Promise<void>(resolve => {
            const unwatch = watch(
                helia_enable,
                newValue => {
                    if (newValue !== undefined) {
                        unwatch() // 停止监听
                        resolve()
                    }
                },
                { immediate: true }
            ) // immediate 确保立即检查当前值
        })
    }
    if (!helia_enable.value) {
        log.debug('启动 Helia 失败: 设置里禁用了 Helia', helia_enable.value)
        helia = null
        return
    }

    if (!helia) {
        log.debug('启动 Helia 节点...')
        helia = await createHelia()
    } else log.debug('已有 Helia 节点')

    if (helia) log.debug('Helia 节点 Peer ID:', helia.libp2p.peerId.toString())
    else log.error('Helia 节点启动失败')
}

export async function get_ipns_file(url: string) {
    if (!helia) {
        log.error('不存在 Helia 对象')
        return null
    }
    const fs = unixfs(helia)
    const ipns_ctrl = ipns(helia as any) // 不需要 keychain 模块

    const ipns_id = url.split('/', 1)[0]
    let path = url.slice(ipns_id.length)
    if (path.endsWith('/')) path = path.slice(0, -1)

    const ipns_res = await ipns_ctrl.resolve(peerIdFromString(ipns_id))

    const chunks = []
    for await (const chunk of fs.cat(ipns_res.cid, { path: path }))
        chunks.push(chunk)

    return Buffer.concat(chunks).buffer
}

export default {} as never
