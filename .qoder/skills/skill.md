# ServiceSnatch 开发技能

## 项目信息

| 属性 | 描述 |
|------|------|
| 项目名称 | ServiceSnatch |
| 项目类型 | Chrome 浏览器扩展插件 |
| 技术栈 | Manifest V3, Chrome Debugger API, 原生 HTML/CSS/JS |
| 核心功能 | 监控浏览器网络请求，自动识别服务并生成 Mock 测试数据 |

### 功能概述

ServiceSnatch 是一款面向前端开发者的 Chrome 插件，用于：
- 录制线上/测试环境的 API 请求响应数据
- 自动识别并按服务名称分类请求
- 一键导出 JSON 格式的 Mock 数据文件

### 项目结构

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

## 角色定义

**浏览器插件资深开发专家**

### 专业能力
- 精通 Chrome Extension Manifest V3 开发规范
- 熟练使用 Chrome Debugger API 进行网络请求拦截
- 掌握 Service Worker 生命周期管理
- 熟悉 chrome.storage API 数据持久化方案
- 具备 Popup UI 交互设计与开发经验

### 职责范围
- 设计并实现插件整体架构
- 开发网络请求捕获与响应体获取功能
- 实现服务名称智能识别算法
- 构建用户界面与交互逻辑
- 实现数据导出功能

---

## 开发步骤

### Step 1: 项目初始化 (0.5 天)

**目标**: 搭建插件基础框架

| 任务 | 说明 | 交付物 |
|------|------|--------|
| 创建 manifest.json | 配置插件权限、入口文件 | `manifest.json` |
| 创建目录结构 | 按模块划分文件目录 | 项目骨架 |
| 设计图标资源 | 创建 16/48/128 三种尺寸图标 | `assets/icons/` |
| 创建 Popup 基础页面 | HTML 结构与基础样式 | `popup/popup.html`, `popup/popup.css` |
| 实现 Background 框架 | Service Worker 入口 | `background/service-worker.js` |

**验收标准**: 插件可加载到 Chrome，点击图标显示 Popup 页面

---

### Step 2: 网络请求捕获 (1 天)

**目标**: 实现核心请求监控功能

| 任务 | 说明 | 交付物 |
|------|------|--------|
| 实现 Debugger API 连接 | 调试器附加/分离逻辑 | `network-monitor.js` |
| 实现请求监听 | 捕获 `Network.requestWillBeSent` 事件 | 请求捕获功能 |
| 实现响应监听 | 捕获 `Network.responseReceived` 事件 | 响应捕获功能 |
| 实现响应体获取 | 调用 `Network.getResponseBody` | 完整响应数据 |

**关键代码**:
```javascript
// 附加调试器
await chrome.debugger.attach({ tabId }, "1.3");
await chrome.debugger.sendCommand({ tabId }, "Network.enable");

// 监听网络事件
chrome.debugger.onEvent.addListener((source, method, params) => {
  if (method === "Network.responseReceived") {
    // 获取响应体
  }
});
```

**验收标准**: 控制台可打印捕获的请求/响应数据

---

### Step 3: 数据处理与存储 (1 天)

**目标**: 实现数据结构化与持久化

| 任务 | 说明 | 交付物 |
|------|------|--------|
| 实现 URL 解析器 | 提取 host/path/query 参数 | `utils/url-parser.js` |
| 实现服务名称识别 | 智能提取服务名称 | `utils/service-detector.js` |
| 实现数据结构化 | 按服务分组组织数据 | `background/data-processor.js` |
| 实现 Storage 存储 | 使用 chrome.storage.local | `background/storage-manager.js` |
| 实现数据清理 | 清空/删除功能 | 数据管理功能 |

**服务名称识别规则** (优先级从高到低):
1. 子域名识别: `api.user.example.com` → `"user"`
2. 路径前缀识别: `/api/v1/user/profile` → `"user"`
3. 域名识别: `user-service.example.com` → `"user-service"`
4. 默认: 使用完整 host

**验收标准**: 请求按服务名称分组存储

---

### Step 4: Popup UI 开发 (1 天)

**目标**: 构建用户交互界面

| 任务 | 说明 | 交付物 |
|------|------|--------|
| 实现录制控制 UI | 开始/停止录制按钮 | 控制面板 |
| 实现状态显示 | 录制状态、请求计数 | 状态栏 |
| 实现服务列表 | 可折叠的服务分组 | 服务分组组件 |
| 实现请求列表 | 方法/URL/状态码展示 | 请求列表组件 |
| 样式美化 | 简洁专业的视觉设计 | 完整样式 |

**UI 布局**:
```
┌─────────────────────────────────┐
│  🔴 ServiceSnatch        [⚙️]  │
├─────────────────────────────────┤
│  [▶️ 开始录制]    [🗑️ 清空]   │
│                                 │
│  📊 已捕获: 23 个请求          │
│                                 │
│  ▼ user-service (8)            │
│    GET /api/user/profile  200  │
│    POST /api/user/login   200  │
│  ▶ order-service (15)          │
│                                 │
├─────────────────────────────────┤
│  [📥 导出 JSON]                │
└─────────────────────────────────┘
```

**验收标准**: 完整的 UI 交互，可查看录制数据

---

### Step 5: JSON 导出功能 (0.5 天)

**目标**: 实现 Mock 数据导出

| 任务 | 说明 | 交付物 |
|------|------|--------|
| 实现数据格式化 | 转换为标准导出格式 | 格式化逻辑 |
| 实现文件下载 | 生成 JSON 文件并触发下载 | `utils/exporter.js` |
| 实现文件命名 | 基于时间戳/页面名称命名 | 文件命名规则 |

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

## 交付物清单

### 核心文件

| 文件路径 | 描述 |
|---------|------|
| `manifest.json` | 插件配置文件 |
| `background/service-worker.js` | 后台服务主入口 |
| `background/network-monitor.js` | 网络监控核心逻辑 |
| `background/data-processor.js` | 数据处理与服务分类 |
| `background/storage-manager.js` | 存储管理模块 |
| `popup/popup.html` | 弹窗页面结构 |
| `popup/popup.css` | 弹窗页面样式 |
| `popup/popup.js` | 弹窗页面逻辑 |
| `utils/url-parser.js` | URL 解析工具 |
| `utils/service-detector.js` | 服务名称识别工具 |
| `utils/exporter.js` | 数据导出工具 |

### 资源文件

| 文件路径 | 描述 |
|---------|------|
| `assets/icons/icon-16.png` | 16x16 图标 |
| `assets/icons/icon-48.png` | 48x48 图标 |
| `assets/icons/icon-128.png` | 128x128 图标 |

### 最终验收标准

- [ ] 插件可正常加载到 Chrome
- [ ] 点击"开始录制"可捕获网络请求
- [ ] 请求按服务名称分组显示
- [ ] 可导出 JSON 格式 Mock 数据
- [ ] 导出数据格式正确可用

---

## 开发时间线

```
Week 1 (共 4 工作日)
├── Day 1: Step 1 (项目初始化)
├── Day 2: Step 2 (网络请求捕获)
├── Day 3: Step 3 (数据处理与存储)
└── Day 4: Step 4 + Step 5 (UI 开发 + 导出功能)
```

---

**文档版本:** v1.0
**创建时间:** 2026-02-28
**基于:** plan3.md
