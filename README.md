# ServiceSnatch

一款面向前端开发者的 Chrome 浏览器扩展插件，用于监控网络请求并自动生成 Mock 测试数据。

## 功能特性

- 🔴 **实时录制** - 一键开始/停止网络请求捕获
- 🎯 **请求类型筛选** - 支持按 HTTP 方法筛选（GET/POST/PUT/DELETE/PATCH）
- 🏷️ **智能分类** - 自动识别服务名称并分组显示
- 🔍 **服务名称筛选** - 快速搜索特定服务的请求
- 📋 **请求详情** - 查看完整的请求/响应数据，支持一键复制
- 🚫 **静态资源过滤** - 自动过滤图片、CSS、JS 等静态资源
- 📁 **自定义存储目录** - 可选择导出文件的保存位置
- 📝 **自定义文件名** - 支持多种变量模板自定义文件名
- 📥 **多种导出格式** - 标准格式、简化格式、Mock 格式
- ⚡ **实时筛选录制** - 只录制选中的请求类型

## 安装方法

### 开发模式加载

1. 打开 Chrome 浏览器，输入 `chrome://extensions/`
2. 开启右上角的 **"开发者模式"**
3. 点击 **"加载已解压的扩展程序"**
4. 选择本项目目录
5. 插件安装完成！

## 使用指南

### 开始录制

1. 点击浏览器工具栏中的 ServiceSnatch 图标
2. 选择要录制的请求类型（GET/POST/PUT/DELETE/PATCH）
3. 点击 **"开始录制"** 按钮
4. 在当前标签页中进行网络请求操作
5. 插件会自动捕获选中的请求类型

### 筛选请求

**请求类型筛选**：
- 在 "📝 录制类型" 区域勾选要录制的请求类型
- 只有选中的类型会被录制
- 可以组合选择多个类型

**服务名称筛选**：
- 在 "🏷️ 服务名称" 输入框中输入关键词
- 实时过滤显示匹配的服务请求

### 查看请求详情

1. 点击任意请求项
2. 弹窗显示完整信息：
   - 基本信息（方法、URL、服务名称、时间）
   - 请求头
   - 请求体（POST/PUT/PATCH）
   - 响应状态
   - 响应数据
3. 支持一键复制：
   - 📋 复制请求
   - 📋 复制响应
   - 📋 复制全部

### 导出 Mock 数据

1. 录制完成后，点击 **"导出 JSON"** 按钮
2. 如果设置了存储目录，文件会保存到指定目录
3. 否则文件会下载到浏览器默认下载位置

#### 文件名模板

支持以下变量自定义文件名：

| 变量 | 格式 | 示例 |
|------|------|------|
| `{date}` | YYYY-MM-DD | 2026-02-28 |
| `{time}` | HH-mm-ss | 11-42-00 |
| `{timestamp}` | Unix 时间戳（毫秒） | 1740735320000 |
| `{service}` | 服务名称 | api-user |
| `{request_type}` | 请求类型（小写） | get/post/put/delete/patch/mixed |

**示例模板**：
- `{request_type}_{timestamp}.json` → `post_1740735320000.json`
- `{service}_{request_type}_{date}.json` → `api-user_post_2026-02-28.json`

#### 导出格式

**标准格式**（包含完整信息）：
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
      "query": {},
      "response": {
        "status": 200,
        "data": { "id": 1, "name": "John" }
      }
    }
  ]
}
```

**简化格式**（仅包含必要信息）：
```json
[
  {
    "service": "user-service",
    "endpoint": "/api/user/profile",
    "method": "GET",
    "query": {},
    "response": {
      "status": 200,
      "data": { "id": 1, "name": "John" }
    }
  }
]
```

**Mock 格式**（适用于 Mock 服务器）：
```json
{
  "GET:/api/user/profile": {
    "request": {},
    "response": {
      "status": 200,
      "data": { "id": 1, "name": "John" }
    }
  }
}
```

### 设置

点击右上角的 ⚙️ 按钮打开设置面板：

1. **导出文件名** - 自定义文件名模板
2. **静态资源过滤** - 自动过滤静态资源请求
3. **导出格式** - 选择导出的数据格式
4. **存储目录** - 选择文件保存位置（需要浏览器支持）

### 清空数据

点击 **"清空"** 按钮可清除所有已捕获的请求。

## 服务名称识别规则

插件按以下优先级识别服务名称：

1. **子域名识别** - `api.user.example.com` → `"user"`
2. **路径前缀识别** - `/api/v1/user/profile` → `"user"`
3. **域名识别** - `user-service.example.com` → `"user-service"`
4. **默认** - 使用完整 host

## 静态资源过滤

默认启用，自动过滤以下类型的请求：

- **图片**：jpg, jpeg, png, gif, svg, webp, ico, bmp, tiff
- **样式**：css
- **脚本**：js, mjs, cjs
- **字体**：woff, woff2, ttf, eot, otf
- **媒体**：mp4, mp3, avi, mov, wmv, flv, wav, ogg
- **文档**：pdf, doc, docx, xls, xlsx, ppt, pptx
- **压缩文件**：zip, rar, tar, gz
- **其他**：map, xml, txt, wasm

**注意**：包含 `/api/`、`/graphql` 等 API 路径标识的请求不会被过滤。

## 项目结构

```
browser-plugin/
├── manifest.json              # 插件配置
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
│   ├── directory-storage.js   # 目录存储管理
│   └── exporter.js            # 导出工具
└── assets/
    └── icons/                 # 图标资源
```

## 技术栈

- **Manifest V3** - Chrome 扩展最新标准
- **Chrome Debugger API** - 网络请求拦截
- **File System Access API** - 目录选择与文件保存
- **IndexedDB** - 持久化存储目录句柄
- **Service Worker** - 后台服务
- **原生 HTML/CSS/JS** - 无框架依赖

## 开发说明

### 添加图标

项目包含图标生成工具 `assets/icons/generate-icons.html`：

1. 在浏览器中打开 `generate-icons.html`
2. 点击 "下载所有图标" 按钮
3. 将下载的图标文件放入 `assets/icons/` 目录

所需尺寸：
- `icon-16.png` (16x16)
- `icon-48.png` (48x48)
- `icon-128.png` (128x128)

### 调试

- **Service Worker 日志**: 在 `chrome://extensions/` 中点击 "Service Worker" 链接
- **Popup 调试**: 右键点击插件图标 → "检查弹出内容"
- **Background Script**: 在 `chrome://extensions/` 中点击 "背景页" 链接

## 浏览器兼容性

| 功能 | Chrome | Edge | Firefox | Safari |
|------|--------|------|---------|--------|
| 网络监控 | ✅ | ✅ | ❌ | ❌ |
| 目录选择 | ✅ 86+ | ✅ 86+ | ❌ | ❌ |

## 注意事项

- 插件需要 "调试器" 权限才能捕获网络请求
- 录制时会对当前标签页附加调试器
- 某些网站可能会检测到调试器并产生不同行为
- 目录选择功能需要 Chrome 86+ 或 Edge 86+

## 许可证

MIT License
