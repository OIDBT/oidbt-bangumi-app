import { log } from '@/log'
import type { Magnet_item, Oidbt_ipfs_bangumi } from '@/stores/mainStore'
import { dezstd } from '@/utils'
import { get_ipns_file, helia, start_helia_node } from '@/helia'

export async function get_bangumi_data_from_ipns(
    url: string
): Promise<Oidbt_ipfs_bangumi | null> {
    try {
        log.debug('get_bangumi_data_from_ipns', url)

        // 提前请求 HTTP
        const response_promise = fetch(url, {
            signal: new AbortController().signal,
        })

        let compressedBuffer: ArrayBuffer | null = null
        if (helia) {
            compressedBuffer = await get_ipns_file(url.split('/ipns/')[1])
            if (compressedBuffer === null)
                log.warn('从 helia.get_ipns_file 获取的数据为 null')
        }
        if (compressedBuffer === null) {
            const response = await response_promise
            if (!response.ok)
                throw new Error(`${response.status} ${response.statusText}`)

            log.debug('HTTP 获取 IPNS 内容:', response)

            compressedBuffer = await response.arrayBuffer()
        }

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
        log.error('获取 IPNS 失败:', url, error)
        return null
    }
}

/**从 Helia 或 公共网关 获取 */
export async function get_bangumi_data_from_ipns_list(
    url_list: string[]
): Promise<Oidbt_ipfs_bangumi | null> {
    await start_helia_node()
    helia?.start()
    const data_list = (
        await Promise.all(
            url_list.map(async url => await get_bangumi_data_from_ipns(url))
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
