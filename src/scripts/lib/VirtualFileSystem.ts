import { IAny } from "../types/LibTypes"
import { FileDataType, FileMetadata } from "../types/IndexedDbTypes"

export class VirtualFileSystem {
  private dbName = "KulonWorkspace"
  private metaStore = "Metadata"
  private contentStore = "Content"
  private version = 2
  private db: IDBDatabase | null = null

  public async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(this.metaStore)) {
          const meta = db.createObjectStore(this.metaStore, { keyPath: "path" })
          meta.createIndex("projectId", "projectId", { unique: false })
        }

        if (!db.objectStoreNames.contains(this.contentStore)) {
          db.createObjectStore(this.contentStore, { keyPath: "path" })
        }
      }

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        resolve()
      }

      request.onerror = (event) => reject(`Failed opening database: ${(event.target as IDBOpenDBRequest).error}`)
    })
  }

  private getDB(): IDBDatabase {
    if (!this.db) throw new Error("Please `init()` the database before continuing")
    return this.db
  }

  public async saveFile(projectId: string, folder: string, fileName: string, type: FileDataType, content: Blob | string | Record<string, IAny>): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = this.getDB()

      const transaction = db.transaction([this.metaStore, this.contentStore], "readwrite")

      const meta = transaction.objectStore(this.metaStore)
      const data = transaction.objectStore(this.contentStore)

      const path = `${projectId}/${folder}/${fileName}`

      meta.put({ path, projectId, folder, fileName, type, updatedAt: Date.now() })

      data.put({ path, content })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(`Failed saving ${fileName}`)
    })
  }

  public async getProjectTree(projectId: string): Promise<FileMetadata[]> {
    return new Promise((resolve, reject) => {
      const db = this.getDB()
      const transaction = db.transaction([this.metaStore], "readonly")
      const store = transaction.objectStore(this.metaStore)
      const index = store.index("projectId")

      const request = index.getAll(projectId)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(`Failed getting tree for ${projectId}`)
    })
  }

  public async readFile(projectId: string, folder: string, fileName: string): Promise<IAny | null> {
    return new Promise((resolve, reject) => {
      const db = this.getDB()
      const transaction = db.transaction([this.contentStore], "readonly")
      const store = transaction.objectStore(this.contentStore)

      const path = `${projectId}/${folder}/${fileName}`
      const request = store.get(path)

      request.onsuccess = () => resolve(request.result ? request.result.content : null)
      request.onerror = () => reject(`Failed reading content of ${path}`)
    })
  }

  public async deleteFile(projectId: string, folder: string, fileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = this.getDB()
      const transaction = db.transaction([this.metaStore, this.contentStore], "readwrite")

      const path = `${projectId}/${folder}/${fileName}`

      transaction.objectStore(this.metaStore).delete(path)
      transaction.objectStore(this.contentStore).delete(path)

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(`Failed deleting file ${path}`)
    })
  }

  public async getAllProjectIds(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const db = this.getDB()

      const transaction = db.transaction([this.metaStore], "readonly")
      const store = transaction.objectStore(this.metaStore)
      const index = store.index("projectId")

      const projectIds: string[] = []

      const request = index.openKeyCursor(null, "nextunique")

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursor>).result

        if (cursor) {
          projectIds.push(cursor.key as string)

          cursor.continue()
        } else {
          resolve(projectIds)
        }
      }

      request.onerror = () => reject(`Failed getting Project ID list`)
    })
  }
}

export const vfs = new VirtualFileSystem()
