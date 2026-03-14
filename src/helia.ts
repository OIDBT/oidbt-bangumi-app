import { ipns } from '@helia/ipns'
import { unixfs } from '@helia/unixfs'
import { peerIdFromString } from '@libp2p/peer-id'
import { IDBBlockstore } from 'blockstore-idb'
import { Buffer } from 'buffer'
import { IDBDatastore } from 'datastore-idb'
import { createHelia, type Helia } from 'helia'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'

import { log } from '@/log'
import { useSettingStore } from '@/stores/settingStore'

export let helia: Helia | null = null
let startingPromise: Promise<void> | null = null // 添加启动状态标志

/**启动 Helia 节点*/
export async function start_helia_node() {
    // 如果已经启动完成且有 helia 实例，直接返回
    if (helia) {
        log.debug('Helia 节点已存在')
        return
    }

    // 如果正在启动中，返回已有的 Promise
    if (startingPromise) {
        log.debug('阻止重复启动: Helia 节点正在启动中...')
        return startingPromise
    }

    // 创建启动 Promise
    startingPromise = (async () => {
        try {
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
                    )
                })
            }

            if (!helia_enable.value) {
                log.debug(
                    '启动 Helia 失败: 设置里禁用了 Helia',
                    helia_enable.value
                )
                helia = null
                return
            }

            log.debug('启动 Helia 节点...')
            const blockstore = new IDBBlockstore('helia')
            await blockstore.open()
            const datastore = new IDBDatastore('helia')
            await datastore.open()
            helia = await createHelia({
                blockstore: blockstore,
                datastore: datastore,
            })
            helia?.start()

            if (helia)
                log.debug('Helia 节点 Peer ID:', helia.libp2p.peerId.toString())
            else log.error('Helia 节点启动失败')
        } finally {
            // 无论成功失败，都清除启动状态
            startingPromise = null
        }
    })()

    return startingPromise
}
/**
 * 获取 IPNS 文件
 * @param resolveTimeout IPNS 解析超时时间（毫秒）
 * @param fileTimeout 文件获取超时时间（毫秒）
 */
export async function get_ipns_file(
    url: string,
    resolveTimeout: number = 12_000,
    fileTimeout: number = 120_000
): Promise<ArrayBuffer> {
    if (!helia) throw new Error(`不存在 Helia 对象: ${url}`)

    // 先声明变量，初始化为 undefined
    let resolveTimeoutId: ReturnType<typeof setTimeout> | undefined
    let fileTimeoutId: ReturnType<typeof setTimeout> | undefined

    // IPNS解析超时 Promise
    const resolveTimeoutPromise = new Promise<never>((_, reject) => {
        resolveTimeoutId = setTimeout(() => {
            reject(new Error(`Helia IPNS 解析超时 (${resolveTimeout}ms)`))
        }, resolveTimeout)
    })

    try {
        const fs = unixfs(helia)
        const ipns_ctrl = ipns(helia as any)

        const ipns_id = url.split('/', 1)[0]
        let path = url.slice(ipns_id.length)
        if (path.endsWith('/')) path = path.slice(0, -1)

        log.debug(`Helia 开始解析 IPNS: ${ipns_id}`)

        // IPNS解析带超时
        const ipns_res = (await Promise.race([
            ipns_ctrl.resolve(peerIdFromString(ipns_id)),
            resolveTimeoutPromise,
        ])) as Awaited<ReturnType<typeof ipns_ctrl.resolve>>

        // 清除IPNS解析超时定时器（如果存在）
        if (resolveTimeoutId) clearTimeout(resolveTimeoutId)

        log.debug(`Helia IPNS 解析成功: ${ipns_res.cid}`)

        // 文件获取超时 Promise
        const fileTimeoutPromise = new Promise<never>((_, reject) => {
            fileTimeoutId = setTimeout(() => {
                reject(new Error(`Helia 文件获取超时 (${fileTimeout}ms)`))
            }, fileTimeout)
        })

        // 获取文件内容带超时
        const chunks: Uint8Array<ArrayBufferLike>[] = []
        const filePromise = (async () => {
            for await (const chunk of fs.cat(ipns_res.cid, { path: path })) {
                chunks.push(chunk)
            }
            return chunks
        })()

        await Promise.race([filePromise, fileTimeoutPromise])

        // 清除文件获取超时定时器（如果存在）
        if (fileTimeoutId) {
            clearTimeout(fileTimeoutId)
        }

        const totalSize = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        log.debug(`Helia 文件获取成功, 大小: ${totalSize} bytes`)

        return Buffer.concat(chunks).buffer
    } catch (error) {
        // 清除所有定时器（如果存在）
        if (resolveTimeoutId) clearTimeout(resolveTimeoutId)

        if (fileTimeoutId) clearTimeout(fileTimeoutId)

        // 错误处理
        let err_msg: string | undefined = undefined
        if (error instanceof Error)
            if (error.message.includes('超时')) err_msg = `get_ipns_file 超时`

        throw new Error(err_msg ?? 'get_ipns_file 失败', { cause: error })
    }
}
