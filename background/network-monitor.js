/**
 * ServiceSnatch - 网络监控模块
 * 使用 Chrome Debugger API 捕获网络请求
 */

class NetworkMonitor {
  constructor() {
    this.attachedTabs = new Set();
    this.requestMap = new Map(); // requestId -> request data
    this.isRecording = false;
    this.filterMethods = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
  }

  /**
   * 加载筛选设置
   */
  async loadFilterSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['filterMethods'], (result) => {
        if (result.filterMethods && result.filterMethods.length > 0) {
          this.filterMethods = new Set(result.filterMethods);
        } else {
          this.filterMethods = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
        }
        resolve();
      });
    });
  }

  /**
   * 开始监听指定标签页的网络请求
   */
  async startMonitoring(tabId) {
    if (this.attachedTabs.has(tabId)) {
      console.log(`Already monitoring tab ${tabId}`);
      return;
    }

    try {
      // 附加调试器
      await chrome.debugger.attach({ tabId }, '1.3');
      // 启用网络监控
      await chrome.debugger.sendCommand({ tabId }, 'Network.enable');

      this.attachedTabs.add(tabId);
      console.log(`Started monitoring tab ${tabId}`);
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      throw error;
    }
  }

  /**
   * 停止监听指定标签页
   */
  async stopMonitoring(tabId) {
    if (!this.attachedTabs.has(tabId)) {
      return;
    }

    try {
      await chrome.debugger.sendCommand({ tabId }, 'Network.disable');
      await chrome.debugger.detach({ tabId });

      this.attachedTabs.delete(tabId);
      console.log(`Stopped monitoring tab ${tabId}`);
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
    }
  }

  /**
   * 停止所有监听
   */
  async stopAllMonitoring() {
    const tabs = Array.from(this.attachedTabs);
    await Promise.all(tabs.map(tabId => this.stopMonitoring(tabId)));
  }

  /**
   * 监听调试器事件
   */
  onEvent(source, method, params) {
    if (!this.isRecording) {
      return;
    }

    switch (method) {
      case 'Network.requestWillBeSent':
        this.handleRequestWillBeSent(source, params);
        break;
      case 'Network.responseReceived':
        this.handleResponseReceived(source, params);
        break;
      case 'Network.loadingFinished':
        this.handleLoadingFinished(source, params);
        break;
      case 'Network.loadingFailed':
        this.handleLoadingFailed(source, params);
        break;
    }
  }

  /**
   * 处理请求发送事件
   */
  handleRequestWillBeSent(source, params) {
    const { requestId, request } = params;

    // 只记录 HTTP/HTTPS 请求
    if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
      return;
    }

    // 过滤静态资源请求
    if (this.isStaticResource(request.url)) {
      return;
    }

    // 根据筛选设置过滤请求
    if (!this.filterMethods.has(request.method)) {
      return;
    }

    // 存储请求信息
    this.requestMap.set(requestId, {
      requestId,
      url: request.url,
      method: request.method,
      headers: request.headers,
      postData: request.postData,
      status: null,
      responseData: null
    });
  }

  /**
   * 处理响应接收事件
   */
  async handleResponseReceived(source, params) {
    const { requestId, response } = params;

    const requestData = this.requestMap.get(requestId);
    if (!requestData) {
      return;
    }

    // 更新状态码
    requestData.status = response.status;
    requestData.mimeType = response.mimeType;
    requestData.responseHeaders = response.headers;
  }

  /**
   * 处理加载完成事件
   */
  async handleLoadingFinished(source, params) {
    const { requestId, timestamp } = params;

    const requestData = this.requestMap.get(requestId);
    if (!requestData) {
      return;
    }

    try {
      // 获取响应体
      const responseBodyResult = await chrome.debugger.sendCommand(
        { tabId: source.tabId },
        'Network.getResponseBody',
        { requestId }
      );

      requestData.responseData = this.parseResponseBody(responseBodyResult.body, responseBodyResult.base64Encoded);

      // 对于 POST/PUT/PATCH 请求，尝试获取请求体
      if (['POST', 'PUT', 'PATCH'].includes(requestData.method) && !requestData.postData) {
        try {
          const postResult = await chrome.debugger.sendCommand(
            { tabId: source.tabId },
            'Network.getRequestPostData',
            { requestId }
          );

          if (postResult.postData) {
            requestData.postData = postResult.postData;
          }
        } catch (e) {
          // 某些请求可能没有 post 数据
          console.log('No post data for request:', requestData.url);
        }
      }

      // 保存到存储
      await this.saveRequest(requestData);
    } catch (error) {
      console.error('Failed to get response body:', error);
    }

    // 清理
    this.requestMap.delete(requestId);
  }

  /**
   * 处理加载失败事件
   */
  handleLoadingFailed(source, params) {
    const { requestId } = params;
    this.requestMap.delete(requestId);
  }

  /**
   * 判断是否是静态资源请求
   */
  isStaticResource(url) {
    const lowerUrl = url.toLowerCase();

    // 首先提取文件路径部分（移除查询参数和 hash）
    let urlPath = lowerUrl.split('?')[0].split('#')[0];

    // 检查是否是 API 调用（API 请求不应该被过滤）
    if (urlPath.includes('/api/') || urlPath.includes('/graphql')) {
      return false;
    }

    // 静态资源扩展名
    const staticExtensions = [
      // 图片
      '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.bmp', '.tiff',
      // 样式
      '.css',
      // 脚本
      '.js', '.mjs', '.cjs',
      // 字体
      '.woff', '.woff2', '.ttf', '.eot', '.otf',
      // 媒体
      '.mp4', '.mp3', '.avi', '.mov', '.wmv', '.flv', '.wav', '.ogg',
      // 文档
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      // 压缩文件
      '.zip', '.rar', '.tar', '.gz',
      // 其他静态资源
      '.map', '.xml', '.txt', '.wasm'
    ];

    // 检查文件扩展名（必须在路径末尾）
    for (const ext of staticExtensions) {
      // 使用正则确保扩展名在 URL 路径的末尾
      const regex = new RegExp(ext.replace('.', '\\.') + '(?:\\?|#|$)');
      if (regex.test(urlPath)) {
        // 对于 .json 和 .js，额外检查是否可能是数据 API
        if ((ext === '.js' || ext === '.json') && this.isLikelyAPI(url)) {
          return false;
        }
        return true;
      }
    }

    // 检查常见的静态资源路径
    const staticPaths = [
      '/static/', '/assets/', '/public/', '/img/', '/images/',
      '/css/', '/js/', '/fonts/', '/media/', '/vendor/',
      '/node_modules/', '/__webpack__/', '/_next/static/'
    ];

    for (const path of staticPaths) {
      if (lowerUrl.includes(path)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 判断是否可能是 API 调用
   */
  isLikelyAPI(url) {
    const lowerUrl = url.toLowerCase();

    // 明确的 API 路径标识
    const apiIndicators = [
      '/api/', '/graphql', '/v1/', '/v2/', '/v3/',
      '/oauth', '/auth', '/login', '/logout',
      '/service', '/services'
    ];

    for (const indicator of apiIndicators) {
      if (lowerUrl.includes(indicator)) {
        return true;
      }
    }

    // 检查是否有查询参数（API 调用通常有查询参数）
    const urlObj = new URL(url);
    if (urlObj.search && urlObj.search.length > 1) {
      // 检查查询参数是否像 API 参数
      const params = urlObj.searchParams.keys();
      for (const param of params) {
        if (['callback', '_', 'token', 'key', 'apikey', 'v', 'version'].includes(param.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 解析响应体
   */
  parseResponseBody(body, isBase64) {
    if (!body) {
      return null;
    }

    // 如果是 base64 编码，先解码
    let content = isBase64 ? atob(body) : body;

    // 尝试解析 JSON
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      try {
        return JSON.parse(content);
      } catch (e) {
        // 不是 JSON，返回原始文本
        return content;
      }
    }

    return content;
  }

  /**
   * 保存请求数据
   */
  async saveRequest(requestData) {
    // 导入 service-detector 获取服务名称
    const serviceName = await this.detectService(requestData.url);

    const processedData = {
      ...requestData,
      serviceName,
      timestamp: Date.now()
    };

    // 使用 StorageManager 保存
    if (self.StorageManager) {
      await self.StorageManager.saveRequest(processedData);
    }
  }

  /**
   * 检测服务名称
   */
  async detectService(url) {
    // ServiceDetector 已通过 importScripts 加载到全局
    if (self.ServiceDetector) {
      return self.ServiceDetector.detect(url);
    }
    return 'unknown';
  }

  /**
   * 开始录制
   */
  async startRecording() {
    // 加载筛选设置
    await this.loadFilterSettings();
    this.isRecording = true;

    // 获取当前活动标签页并开始监听
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      await this.startMonitoring(tabs[0].id);
    }
  }

  /**
   * 停止录制
   */
  async stopRecording() {
    this.isRecording = false;
    await this.stopAllMonitoring();
  }

  /**
   * 更新筛选设置（实时）
   */
  async updateFilterSettings(filterMethods) {
    if (Array.isArray(filterMethods) && filterMethods.length > 0) {
      this.filterMethods = new Set(filterMethods);
    } else {
      this.filterMethods = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
    }
    console.log('Filter settings updated:', Array.from(this.filterMethods));
  }
}

// 创建单例
const networkMonitor = new NetworkMonitor();

// 监听调试器事件
chrome.debugger.onEvent.addListener((source, method, params) => {
  networkMonitor.onEvent(source, method, params);
});

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startRecording') {
    networkMonitor.startRecording().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'stopRecording') {
    networkMonitor.stopRecording().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'updateFilterMethods') {
    networkMonitor.updateFilterSettings(request.filterMethods).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// 监听 storage 变化，实时更新筛选设置
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.filterMethods) {
    const newMethods = changes.filterMethods.newValue;
    if (newMethods) {
      networkMonitor.updateFilterSettings(newMethods);
    }
  }
});

// 将 networkMonitor 暴露到全局
self.networkMonitor = networkMonitor;
