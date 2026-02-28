/**
 * ServiceSnatch - URL 解析工具
 */

class URLParser {
  /**
   * 解析 URL 并返回详细信息
   */
  static parse(url) {
    try {
      const urlObj = new URL(url);
      return {
        href: urlObj.href,
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: urlObj.port,
        pathname: urlObj.pathname,
        search: urlObj.search,
        hash: urlObj.hash,
        params: this.parseSearchParams(urlObj.search)
      };
    } catch (error) {
      console.error('Failed to parse URL:', error);
      return null;
    }
  }

  /**
   * 解析查询参数
   */
  static parseSearchParams(search) {
    if (!search || search === '?') {
      return {};
    }

    const params = {};
    const pairs = search.substring(1).split('&');

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    }

    return params;
  }

  /**
   * 提取 URL 的主域名
   */
  static getMainDomain(hostname) {
    const parts = hostname.split('.');

    // 如果是 localhost 或 IP，直接返回
    if (parts.length <= 2 || hostname === 'localhost') {
      return hostname;
    }

    // 提取主域名（最后两个部分）
    return parts.slice(-2).join('.');
  }

  /**
   * 判断是否是同源请求
   */
  static isSameOrigin(url1, url2) {
    try {
      const urlObj1 = new URL(url1);
      const urlObj2 = new URL(url2);
      return urlObj1.origin === urlObj2.origin;
    } catch (error) {
      return false;
    }
  }
}

// 导出为全局（用于 Service Worker importScripts）
self.URLParser = URLParser;
