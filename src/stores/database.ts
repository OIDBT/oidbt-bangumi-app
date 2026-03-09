import { PROJECT_NAME } from '@/global_val'
import { log } from '@/log'

// 数据库连接 Promise
const db_promise: Promise<IDBDatabase> = new Promise((resolve, reject) => {
    const db_req = indexedDB.open(PROJECT_NAME, 1)

    db_req.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result

        const store_setting = db.createObjectStore('setting', {
            keyPath: 'name',
        })
        store_setting.createIndex('name', 'name')
        store_setting.createIndex('value', 'value')
    }

    db_req.onerror = event => {
        log.error('数据库打开失败:', (event.target as IDBOpenDBRequest).error)
        reject((event.target as IDBOpenDBRequest).error)
    }

    db_req.onsuccess = event => {
        const db = (event.target as IDBOpenDBRequest).result
        log.log('数据库打开成功')
        resolve(db)
    }
})

// 定义 Setting 类型
export interface Store_setting {
    name: string
    value: any
}

// 封装对 setting 表的操作
export const setting_db = {
    // 获取所有设置
    async getAll(): Promise<Store_setting[]> {
        const db = await db_promise
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['setting'], 'readonly')
            const store = transaction.objectStore('setting')
            const request = store.getAll()

            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    },

    // 根据 name 获取设置
    async get(name: string): Promise<Store_setting | undefined> {
        const db = await db_promise
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['setting'], 'readonly')
            const store = transaction.objectStore('setting')
            const request = store.get(name)

            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    },

    // 添加或更新设置
    async set(name: string, value: any): Promise<void> {
        const db = await db_promise
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['setting'], 'readwrite')
            const store = transaction.objectStore('setting')
            const request = store.put({ name, value })

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    },

    // 批量添加或更新设置
    async setMany(settings: Store_setting[]): Promise<void> {
        const db = await db_promise
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['setting'], 'readwrite')
            const store = transaction.objectStore('setting')

            settings.forEach(setting => {
                store.put(setting)
            })

            transaction.oncomplete = () => resolve()
            transaction.onerror = () => reject(transaction.error)
        })
    },

    // 删除设置
    async delete(name: string): Promise<void> {
        const db = await db_promise
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['setting'], 'readwrite')
            const store = transaction.objectStore('setting')
            const request = store.delete(name)

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    },

    // 清空所有设置
    async clear(): Promise<void> {
        const db = await db_promise
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['setting'], 'readwrite')
            const store = transaction.objectStore('setting')
            const request = store.clear()

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    },
}

// 也可以导出数据库连接本身，如果需要直接操作
export { db_promise as db }
