# Network Request Monitor - P0 优先实现计划

> 基于 plan2.md 精简，仅包含 P0 级核心功能的最小可行产品 (MVP)

---

## 一、P0 功能范围

| 功能模块 | 优先级 | 说明 |
|---------|-------|------|
| 录制开关控制 | P0 | 开始/停止录制按钮 |
| XHR/Fetch 请求捕获 | P0 | 捕获所有网络请求 |
| 响应体捕获 | P0 | 获取完整响应数据 |
| 服务名称自动识别 | P0 | 从 URL 自动提取服务名 |
| 请求列表展示 | P0 | 按服务分组展示请求 |
| JSON 导出 | P0 | 导出 Mock 数据文件 |

---

## 二、核心数据结构

```typescript
interface RecordedData {
  meta: {
    pageUrl: string;
    pageTitle: string;
    startTime: number;
    endTime?: number;
    totalRequests: number;
  };
  services: {
    [serviceName: string]: {
      name: string;
      baseUrl: string;
      requests: RequestRecord[];
    };
  };
}

interface RequestRecord {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  path: string;
  request: {
    headers: Record<string, string>;
    query: Record<string, string>;
    body?: any;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    size: number;
    time: number;
  };
}
```

---

## 三、项目结构 (精简版)

```
browser-plugin/
├── manifest.json              # 插件配置 (Manifest V3)
├── background/
│   ├── service-worker.js      # 后台服务主入口
│   ├── network-monitor.js     # 网络监控核心逻辑
│   ├── data-processor.js      # 数据处理与服务分类
│   └── storage-manager.js     # 存储管理
├── popup/
│   ├── popup.html             # 弹窗页面
│   ├── popup.css              # 样式
│   └── popup.js               # 主逻辑
├── utils/
│   ├── url-parser.js          # URL 解析工具
│   ├── service-detector.js    # 服务名称识别
│   └── exporter.js            # 导出工具
└── assets/
    └── icons/
        ├── icon-16.png
        ├── icon-48.png
        └── icon-128.png
```

---

## 四、开发任务拆分

### Phase 1: 项目初始化 (0.5 天)

| Task ID | 任务 | 产出 | 预估 |
|---------|------|------|------|
| T1.1 | 创建 manifest.json | 插件基础配置 | 15min |
| T1.2 | 创建目录结构 | 项目骨架 | 10min |
| T1.3 | 设计图标资源 | 3 个尺寸图标 | 30min |
| T1.4 | 创建 Popup 基础页面 | HTML/CSS 框架 | 1h |
| T1.5 | 实现 Background 基础框架 | Service Worker 入口 | 30min |

**验收标准**: 插件可加载到 Chrome，点击图标显示空白 Popup

---

### Phase 2: 网络请求捕获 (1 天)

| Task ID | 任务 | 产出 | 预估 |
|---------|------|------|------|
| T2.1 | 实现 Debugger API 连接 | 调试器附加/分离 | 2h |
| T2.2 | 实现请求监听 | 捕获 requestWillBeSent | 2h |
| T2.3 | 实现响应监听 | 捕获 responseReceived | 2h |
| T2.4 | 实现响应体获取 | getResponseBody | 2h |

**验收标准**: 控制台可打印捕获的请求/响应数据

---

### Phase 3: 数据处理与存储 (1 天)

| Task ID | 任务 | 产出 | 预估 |
|---------|------|------|------|
| T3.1 | 实现 URL 解析器 | 提取 host/path/query | 1h |
| T3.2 | 实现服务名称识别 | 从 URL 提取服务名 | 2h |
| T3.3 | 实现数据结构化 | 按服务分组存储 | 2h |
| T3.4 | 实现 Storage 存储 | chrome.storage.local | 1.5h |
| T3.5 | 实现数据清理 | 清空/删除功能 | 0.5h |

**服务名称识别规则**:
```javascript
// 优先级从高到低
1. 子域名识别: api.user.example.com → "user"
2. 路径前缀识别: /api/v1/user/profile → "user"
3. 域名识别: user-service.example.com → "user-service"
4. 默认: 使用完整 host
```

**验收标准**: 请求按服务名称分组存储

---

### Phase 4: Popup UI 开发 (1 天)

| Task ID | 任务 | 产出 | 预估 |
|---------|------|------|------|
| T4.1 | 实现录制控制 UI | 开始/停止按钮 | 1h |
| T4.2 | 实现状态显示 | 录制状态/请求计数 | 1h |
| T4.3 | 实现服务列表 | 可折叠的服务分组 | 2h |
| T4.4 | 实现请求列表 | 方法/URL/状态码展示 | 2h |
| T4.5 | 样式美化 | 简洁的视觉设计 | 1h |

**UI 设计稿**:
```
┌─────────────────────────────────┐
│  🔴 Network Monitor      [⚙️]  │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │  [▶️ 开始录制] [🗑️清空] │   │
│  └─────────────────────────┘   │
│                                 │
│  📊 已捕获: 23 个请求          │
│                                 │
│  ▼ user-service (8)            │
│    GET /api/user/profile  200  │
│    POST /api/user/login   200  │
│    ...                         │
│  ▶ order-service (15)          │
│                                 │
├─────────────────────────────────┤
│  [📥 导出 JSON]                │
└─────────────────────────────────┘
```

**验收标准**: 完整的 UI 交互，可查看录制数据

---

### Phase 5: JSON 导出功能 (0.5 天)

| Task ID | 任务 | 产出 | 预估 |
|---------|------|------|------|
| T5.1 | 实现数据格式化 | 转换为导出格式 | 1h |
| T5.2 | 实现文件下载 | JSON 文件生成 | 1h |
| T5.3 | 实现文件命名 | 时间戳/页面名称 | 0.5h |

**导出格式**:
```json
{
  "version": "1.0",
  "exportTime": "2026-02-28T10:30:00Z",
  "source": "https://example.com/dashboard",
  "mocks": [
    {
      "service": "user-service",
      "endpoint": "/api/user/profile",
      "method": "GET",
      "response": {
        "status": 200,
        "data": { "id": 1, "name": "John" }
      }
    }
  ]
}
```

**验收标准**: 可导出格式正确的 JSON Mock 数据文件

---

## 五、关键代码

### 5.1 manifest.json
```json
{
  "manifest_version": 3,
  "name": "Network Request Monitor",
  "version": "1.0.0",
  "description": "监控浏览器网络请求，生成 Mock 测试数据",
  "permissions": [
    "debugger",
    "storage",
    "activeTab",
    "tabs"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "assets/icons/icon-16.png",
      "48": "assets/icons/icon-48.png",
      "128": "assets/icons/icon-128.png"
    }
  },
  "icons": {
    "16": "assets/icons/icon-16.png",
    "48": "assets/icons/icon-48.png",
    "128": "assets/icons/icon-128.png"
  }
}
```

### 5.2 核心监控逻辑
```javascript
// background/network-monitor.js
class NetworkMonitor {
  constructor(tabId) {
    this.tabId = tabId;
    this.requests = new Map();
    this.isRecording = false;
  }

  async start() {
    await chrome.debugger.attach({ tabId: this.tabId }, "1.3");
    await chrome.debugger.sendCommand({ tabId: this.tabId }, "Network.enable");
    this.isRecording = true;
  }

  async stop() {
    await chrome.debugger.detach({ tabId: this.tabId });
    this.isRecording = false;
  }

  handleDebuggerEvent(method, params) {
    switch (method) {
      case "Network.requestWillBeSent":
        this.onRequestStart(params);
        break;
      case "Network.responseReceived":
        this.onResponseReceived(params);
        break;
    }
  }

  async onResponseReceived(params) {
    const { body } = await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      "Network.getResponseBody",
      { requestId: params.requestId }
    );
    // 存储响应数据...
  }
}
```

---

## 六、开发时间线

```
Week 1 (共 4 工作日)
├── Day 1: Phase 1 (项目初始化)
├── Day 2: Phase 2 (网络请求捕获)
├── Day 3: Phase 3 (数据处理与存储)
└── Day 4: Phase 4 + Phase 5 (UI 开发 + 导出功能)
```

---

## 七、MVP 验收清单

- [ ] 插件可正常加载到 Chrome
- [ ] 点击"开始录制"可捕获网络请求
- [ ] 请求按服务名称分组显示
- [ ] 可导出 JSON 格式 Mock 数据
- [ ] 导出数据格式正确可用

---

**文档版本:** v3.0 (P0 精简版)
**创建时间:** 2026-02-28
**基于:** plan2.md
