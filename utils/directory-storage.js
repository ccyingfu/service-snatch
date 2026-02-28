/**
 * ServiceSnatch - 目录存储管理
 * 使用 IndexedDB 存储 FileSystemDirectoryHandle
 */

class DirectoryStorage {
  constructor() {
    this.dbName = 'ServiceSnatchDB';
    this.storeName = 'directories';
    this.db = null;
  }

  /**
   * 初始化 IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  /**
   * 保存目录句柄
   */
  async saveDirectory(key, handle) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(handle, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取目录句柄
   */
  async getDirectory(key) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除目录句柄
   */
  async deleteDirectory(key) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 请求目录权限
   */
  async requestPermission(handle) {
    if (!handle) {
      return false;
    }

    // 检查权限状态
    const options = { mode: 'readwrite' };
    if ((await handle.queryPermission(options)) === 'granted') {
      return true;
    }

    // 请求权限
    return (await handle.requestPermission(options)) === 'granted';
  }

  /**
   * 在目录中创建文件
   */
  async createFile(directoryHandle, filename, content) {
    // 确保有权限
    const hasPermission = await this.requestPermission(directoryHandle);
    if (!hasPermission) {
      throw new Error('No permission to write to directory');
    }

    // 创建文件
    const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  /**
   * 验证目录句柄是否仍然有效
   */
  async verifyHandle(handle) {
    if (!handle) {
      return false;
    }

    try {
      // 尝试查询权限来验证句柄是否仍然有效
      await handle.queryPermission({ mode: 'readwrite' });
      return true;
    } catch (e) {
      return false;
    }
  }
}

// 创建单例并导出
const directoryStorage = new DirectoryStorage();

// 兼容不同环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = directoryStorage;
} else if (typeof self !== 'undefined') {
  self.DirectoryStorage = directoryStorage;
}
