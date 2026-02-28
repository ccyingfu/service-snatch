/**
 * ServiceSnatch - 数据处理模块
 */

class DataProcessor {
  /**
   * 处理请求数据
   */
  static processRequest(rawRequest) {
    return {
      id: this.generateId(),
      url: rawRequest.url,
      method: rawRequest.method,
      status: rawRequest.status,
      serviceName: rawRequest.serviceName || 'unknown',
      timestamp: rawRequest.timestamp || Date.now(),
      requestData: this.processRequestData(rawRequest),
      responseData: rawRequest.responseData,
      headers: this.processHeaders(rawRequest.headers || {})
    };
  }

  /**
   * 生成唯一 ID
   */
  static generateId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 处理请求数据
   */
  static processRequestData(rawRequest) {
    const data = {
      method: rawRequest.method,
      url: rawRequest.url
    };

    if (rawRequest.postData) {
      try {
        data.body = JSON.parse(rawRequest.postData);
      } catch (e) {
        data.body = rawRequest.postData;
      }
    }

    return data;
  }

  /**
   * 处理响应头
   */
  static processHeaders(headers) {
    if (typeof headers === 'object') {
      return headers;
    }

    // 如果是字符串格式，解析为对象
    const parsed = {};
    if (typeof headers === 'string') {
      const lines = headers.split('\n');
      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          parsed[key.trim()] = valueParts.join(':').trim();
        }
      }
    }
    return parsed;
  }

  /**
   * 按服务分组请求
   */
  static groupByService(requests) {
    const grouped = {};

    for (const req of requests) {
      const serviceName = req.serviceName || 'unknown';
      if (!grouped[serviceName]) {
        grouped[serviceName] = [];
      }
      grouped[serviceName].push(req);
    }

    return grouped;
  }

  /**
   * 过滤请求
   */
  static filterRequests(requests, filters) {
    return requests.filter(req => {
      // 按服务名过滤
      if (filters.service && req.serviceName !== filters.service) {
        return false;
      }

      // 按方法过滤
      if (filters.method && req.method !== filters.method) {
        return false;
      }

      // 按状态码过滤
      if (filters.status && req.status !== filters.status) {
        return false;
      }

      // 按关键词搜索
      if (filters.keyword && !req.url.includes(filters.keyword)) {
        return false;
      }

      return true;
    });
  }

  /**
   * 统计信息
   */
  static getStatistics(requests) {
    const stats = {
      total: requests.length,
      byService: {},
      byMethod: {},
      byStatus: {}
    };

    for (const req of requests) {
      // 按服务统计
      const service = req.serviceName || 'unknown';
      stats.byService[service] = (stats.byService[service] || 0) + 1;

      // 按方法统计
      const method = req.method;
      stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;

      // 按状态码统计
      const status = req.status;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    }

    return stats;
  }
}

// 导出为全局（用于 Service Worker importScripts）
self.DataProcessor = DataProcessor;
