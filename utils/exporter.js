/**
 * ServiceSnatch - 数据导出工具
 */

class Exporter {
  /**
   * 导出为 JSON 格式
   */
  static async exportJSON(requests) {
    const exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      source: await this.getCurrentTabUrl(),
      mocks: requests.map(req => this.formatRequest(req))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 格式化单个请求
   */
  static formatRequest(req) {
    const urlObj = new URL(req.url);

    return {
      service: req.serviceName,
      endpoint: urlObj.pathname,
      method: req.method,
      query: Object.fromEntries(urlObj.searchParams),
      response: {
        status: req.status,
        headers: req.responseHeaders,
        data: req.responseData
      },
      timestamp: req.timestamp
    };
  }

  /**
   * 获取当前标签页 URL
   */
  static async getCurrentTabUrl() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]?.url || 'unknown');
      });
    });
  }

  /**
   * 触发文件下载
   */
  static download(content, filename) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 生成导出文件名
   */
  static generateFilename() {
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, '-').split('T')[0];
    return `servicesnatch-mocks-${timestamp}.json`;
  }

  /**
   * 导出并下载
   */
  static async exportAndDownload(requests) {
    if (!requests || requests.length === 0) {
      throw new Error('No data to export');
    }

    const content = await this.exportJSON(requests);
    const filename = this.generateFilename();
    this.download(content, filename);
  }
}

// 导出为全局（用于 Service Worker importScripts）
self.Exporter = Exporter;
