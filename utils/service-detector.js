/**
 * ServiceSnatch - 服务名称识别工具
 */

class ServiceDetector {
  /**
   * 检测 URL 对应的服务名称
   * 优先级（从高到低）:
   * 1. 子域名识别: api.user.example.com -> "user"
   * 2. 路径前缀识别: /api/v1/user/profile -> "user"
   * 3. 域名识别: user-service.example.com -> "user-service"
   * 4. 默认: 使用完整 host
   */
  static detect(url) {
    try {
      const urlObj = new URL(url);
      const { hostname, pathname } = urlObj;

      // 规则 1: 子域名识别
      const subdomainService = this.detectFromSubdomain(hostname);
      if (subdomainService) {
        return subdomainService;
      }

      // 规则 2: 路径前缀识别
      const pathService = this.detectFromPath(pathname);
      if (pathService) {
        return pathService;
      }

      // 规则 3: 域名识别
      const domainService = this.detectFromDomain(hostname);
      if (domainService) {
        return domainService;
      }

      // 规则 4: 默认使用完整 host
      return hostname;
    } catch (error) {
      console.error('Failed to detect service:', error);
      return 'unknown';
    }
  }

  /**
   * 从子域名检测服务名称
   * api.user.example.com -> "user"
   * user.api.example.com -> "user"
   */
  static detectFromSubdomain(hostname) {
    const parts = hostname.split('.');

    // 常见的 API 子域名
    const apiPrefixes = ['api', 'gateway', 'proxy', 'app'];
    const servicePrefixes = ['service', 'svc'];

    // 检查: api.{service}.domain 或 {service}.api.domain
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      // 如果当前部分是 API 前缀，检查下一个部分
      if (apiPrefixes.includes(part.toLowerCase()) && i + 1 < parts.length) {
        const potentialService = parts[i + 1];
        // 如果下一个部分不是常见前缀，则认为是服务名
        if (!apiPrefixes.includes(potentialService.toLowerCase())) {
          return potentialService;
        }
      }

      // 检查 {service}-service 或 {service}-svc
      if (part.endsWith('-service') || part.endsWith('-svc')) {
        return part.replace(/-service|-svc/g, '');
      }

      const lowerPart = part.toLowerCase();
      for (const prefix of servicePrefixes) {
        if (lowerPart === `${prefix}-` || lowerPart.endsWith(`-${prefix}`)) {
          return part.replace(new RegExp(`${prefix}-?|-${prefix}`, 'g'), '');
        }
      }
    }

    return null;
  }

  /**
   * 从路径检测服务名称
   * /api/v1/user/profile -> "user"
   * /user/api/v1/profile -> "user"
   */
  static detectFromPath(pathname) {
    // 移除开头的斜杠并分割
    const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);

    if (parts.length === 0) {
      return null;
    }

    // 常见的 API 路径前缀
    const apiPrefixes = ['api', 'v1', 'v2', 'v3', 'rest', 'graphql'];

    // 跳过 API 前缀，找到第一个有意义的路径段
    for (const part of parts) {
      const lowerPart = part.toLowerCase();
      // 跳过版本号和 API 标识
      if (!apiPrefixes.includes(lowerPart) && !lowerPart.match(/^v\d+$/)) {
        // 找到了，返回服务名
        return part;
      }
    }

    return null;
  }

  /**
   * 从域名检测服务名称
   * user-service.example.com -> "user-service"
   * example-user-service.com -> "user-service"
   */
  static detectFromDomain(hostname) {
    const parts = hostname.split('.');

    // 检查每个部分是否包含 service
    for (const part of parts) {
      if (part.includes('-service') || part.includes('-svc')) {
        return part;
      }

      // 检查是否是驼峰命名 + service/svc
      if (part.toLowerCase().endsWith('service') || part.toLowerCase().endsWith('svc')) {
        return part;
      }
    }

    return null;
  }
}

// 导出为全局（用于 Service Worker importScripts）
self.ServiceDetector = ServiceDetector;
