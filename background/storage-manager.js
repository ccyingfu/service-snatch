/**
 * ServiceSnatch - 存储管理模块
 */

class StorageManager {
  /**
   * 存储键名
   */
  static KEYS = {
    CAPTURED_REQUESTS: 'capturedRequests',
    IS_RECORDING: 'isRecording',
    SETTINGS: 'settings'
  };

  /**
   * 保存单个请求
   */
  static async saveRequest(requestData) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.KEYS.CAPTURED_REQUESTS], (result) => {
        const requests = result[this.KEYS.CAPTURED_REQUESTS] || [];
        requests.push(requestData);

        chrome.storage.local.set(
          { [this.KEYS.CAPTURED_REQUESTS]: requests },
          () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(requests);
            }
          }
        );
      });
    });
  }

  /**
   * 批量保存请求
   */
  static async saveRequests(requestsData) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.KEYS.CAPTURED_REQUESTS], (result) => {
        const requests = result[this.KEYS.CAPTURED_REQUESTS] || [];
        requests.push(...requestsData);

        chrome.storage.local.set(
          { [this.KEYS.CAPTURED_REQUESTS]: requests },
          () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(requests);
            }
          }
        );
      });
    });
  }

  /**
   * 获取所有请求
   */
  static async getRequests() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.KEYS.CAPTURED_REQUESTS], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[this.KEYS.CAPTURED_REQUESTS] || []);
        }
      });
    });
  }

  /**
   * 清空所有请求
   */
  static async clearRequests() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        { [this.KEYS.CAPTURED_REQUESTS]: [] },
        () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * 删除指定请求
   */
  static async deleteRequest(requestId) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.KEYS.CAPTURED_REQUESTS], (result) => {
        const requests = result[this.KEYS.CAPTURED_REQUESTS] || [];
        const filtered = requests.filter(req => req.id !== requestId);

        chrome.storage.local.set(
          { [this.KEYS.CAPTURED_REQUESTS]: filtered },
          () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(filtered);
            }
          }
        );
      });
    });
  }

  /**
   * 获取录制状态
   */
  static async getRecordingStatus() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.KEYS.IS_RECORDING], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[this.KEYS.IS_RECORDING] || false);
        }
      });
    });
  }

  /**
   * 设置录制状态
   */
  static async setRecordingStatus(isRecording) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        { [this.KEYS.IS_RECORDING]: isRecording },
        () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * 获取设置
   */
  static async getSettings() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.KEYS.SETTINGS], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[this.KEYS.SETTINGS] || this.getDefaultSettings());
        }
      });
    });
  }

  /**
   * 保存设置
   */
  static async saveSettings(settings) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        { [this.KEYS.SETTINGS]: settings },
        () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * 获取默认设置
   */
  static getDefaultSettings() {
    return {
      autoStart: false,
      maxRequests: 1000,
      excludePatterns: [],
      includePatterns: []
    };
  }

  /**
   * 获取存储使用情况
   */
  static async getStorageInfo() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.getBytesInUse([this.KEYS.CAPTURED_REQUESTS], (bytes) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve({
            bytesUsed: bytes,
            bytesUsedMB: (bytes / 1024 / 1024).toFixed(2)
          });
        }
      });
    });
  }
}

// 导出为全局（用于 Service Worker importScripts）
self.StorageManager = StorageManager;
