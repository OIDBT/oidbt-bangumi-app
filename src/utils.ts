import { decompress, init, type DecompressOption } from '@bokuweb/zstd-wasm'
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

export async function fetch_check(
    input: string | URL | Request,
    init?: RequestInit
): Promise<Response> {
    log.debug('fetch_check 开始请求', input, init)

    const response = await fetch(input, init)

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${input}`)

    log.debug('fetch_check 请求成功', input, init)

    return response
}
