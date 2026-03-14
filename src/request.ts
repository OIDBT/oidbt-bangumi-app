import { storeToRefs } from 'pinia'

import {
    get_ipns_file as get_ipns_file_from_helia,
    helia,
    start_helia_node,
} from '@/helia'
import { log } from '@/log'
import type { Magnet_item, Oidbt_ipfs_bangumi } from '@/stores/mainStore'
import { useSettingStore } from '@/stores/settingStore'
import { dezstd, fetch_check } from '@/utils'

/**从 Helia 和 公共网关 获取
 * @param ipns_url - format: /ipns/.../${bangumi_id}
 */
export async function get_bangumi_data_from_ipns(
    ipns_url: string
): Promise<Oidbt_ipfs_bangumi | null> {
    const settingStore = useSettingStore()
    const { trusted_source_gate_list } = storeToRefs(settingStore)
    try {
        log.debug('get_bangumi_data_from_ipns', ipns_url)

        const response_promise = (async () => {
            const resp = await Promise.any(
                trusted_source_gate_list.value.map(async url => {
                    try {
                        return await fetch_check(url + ipns_url, {
                            signal: new AbortController().signal,
                        })
                    } catch (err) {
                        log.error(err)
                        throw err
                    }
                })
            )
            return resp.arrayBuffer()
        })()
        const ipns_file_promise = (async () => {
            try {
                return await get_ipns_file_from_helia(
                    ipns_url.split('/ipns/')[1]
                )
            } catch (err) {
                log.error(err)
                throw err
            }
        })()

        const compressedBuffer = await Promise.any([
            response_promise,
            ipns_file_promise,
        ])

        log.debug('获取到压缩数据，大小:', compressedBuffer.byteLength, 'bytes')
        const decompressedBuffer = await dezstd(
            new Uint8Array(compressedBuffer)
        )
        log.debug('解压完成，大小:', decompressedBuffer.byteLength, 'bytes')

        const res = JSON.parse(
            new TextDecoder().decode(decompressedBuffer)
        ) as Oidbt_ipfs_bangumi
        log.debug('解码数据:', res)
        return res
    } catch (error) {
        log.error('获取 IPNS 失败:', ipns_url, error)
        return null
    }
}

/**从 Helia 和 公共网关 获取
 * @param ipns_url_list - format: /ipns/.../${bangumi_id}
 */
export async function get_bangumi_data_from_ipns_list(
    ipns_url_list: string[]
): Promise<Oidbt_ipfs_bangumi | null> {
    await start_helia_node()
    helia?.start()
    const data_list = (
        await Promise.all(
            ipns_url_list.map(
                async url => await get_bangumi_data_from_ipns(url)
            )
        )
    ).filter(v => v != null)
    helia?.stop()

    if (data_list.length === 0) return null

    const magnet_map = new Map<string, Magnet_item[]>()
    for (let it of data_list.map(v => v.magnet_list).flat()) {
        const magnet = it.magnet
        const arr = magnet_map.get(magnet) ?? []
        arr.push(it)
        magnet_map.set(magnet, arr)
    }

    return {
        update_time: data_list.map(v => v.update_time).join(' '),
        magnet_list: [...magnet_map].map(([k, it]) => ({
            magnet: k,
            source_link_set: [
                ...new Set(it.map(v => v.source_link_set).flat()),
            ],
            title_set: [...new Set(it.map(v => v.title_set).flat())],
            cid: it[0]?.cid ?? '',
        })),
    }
}
