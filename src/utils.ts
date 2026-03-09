import { decompress, init, type DecompressOption } from '@bokuweb/zstd-wasm'
import type { Oidbt_ipfs_bangumi } from '@/stores/mainStore'
import { log } from '@/log'

await init()
export async function dezstd(buf: Uint8Array, opts?: DecompressOption) {
    return await decompress(buf, opts)
}

export function get_trusted_source_list_from_head(
    lines: string[],
    head: string
) {
    const regex = new RegExp(`^${head}(.+)`)
    return lines
        .map(line => (line.match(regex) || [])[1] || null)
        .filter(v => v != null)
}
