import { decompress, init, type DecompressOption } from '@bokuweb/zstd-wasm'

await init()
export async function dezstd(buf: Uint8Array, opts?: DecompressOption) {
    return await decompress(buf, opts)
}
