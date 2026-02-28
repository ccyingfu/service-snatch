# Network Request Monitor - 改进计划

## 项目现状

### ✅ 已实现功能

| 功能模块 | 实现状态 | 文件位置 |
|---------|---------|---------|
| 网络请求监控 | ✅ 完成 | [background.js:144-347](background.js#L144-L347) |
| 请求/响应捕获 | ✅ 完成 | [background.js:244-330](background.js#L244-L330) |
| 服务名称提取 | ✅ 完成 | [background.js:68-139](background.js#L68-L139) |
| 数据存储 | ✅ 完成 | [background.js:10-63](background.js#L10-L63) |
| JSON 导出 | ✅ 完成 | [background.js:413-432](background.js#L413-L432) |
| Popup UI | ✅ 完成 | [popup/popup.js](popup/popup.js) |

### 核心技术方案
- **Chrome Debugger API** - 完整捕获网络请求和响应体
- **智能服务分类** - 从子域名/路径提取服务名
- **请求过滤** - 自动排除静态资源
- **标签页隔离** - 每个标签页独立录制

---

## 市场对比分析

### 现有类似插件

| 插件名称 | 主要功能 | 与本项目差异 |
|---------|---------|------------|
| Postman Interceptor | 完整 API 测试，需配合 Postman | 本项目轻量，专注 Mock 数据生成 |
| Talend API Tester | 完整的 HTTP 客户端 | 本项目专注于数据捕获而非测试 |
| Network Monitor | 基础网络监控 | 本项目增加了服务分类和导出 |
| Beeceptor | 在线 Mock 服务 | 本项目离线可用，无隐私顾虑 |

### 本项目核心优势
- 专注 Mock 数据生成场景
- 自动服务分类，方便数据组织
- 开源可定制
- 数据本地存储，隐私安全

---

## 分阶段改进计划

### 阶段一：基础增强（快速见效）

#### 1. Mock 数据格式优化
**目标**: 使导出的数据可直接用于主流 Mock 框架

**实现内容**:
```
支持的导出格式:
├─ MSW (Mock Service Worker) handlers
├─ Mock.js 数据模板
├─ JSON Server REST API
└─ TypeScript 类型定义 (.d.ts)

数据脱敏功能:
├─ 手机号脱敏: 138****1234
├─ 邮箱脱敏: u***@example.com
├─ token 替换: {{ACCESS_TOKEN}}
└─ 敏感字段删除: password, secret 等
```

**文件变更**:
- [background.js:413-432](background.js#L413-L432) - 扩展 `generateMockData()` 函数
- 新增 `utils/formatters/` - 各格式转换器
- [popup/popup.js](popup/popup.js) - 添加格式选择 UI

---

#### 2. 导出选项增强
**目标**: 提供更灵活的导出方式

**实现内容**:
```
导出结构选项:
├─ 单文件扁平结构
├─ 按服务分文件
├─ 按请求类型分组 (GET/POST/...)
└─ 树状层级结构

文件命名:
├─ 时间戳: mock-data-2025-02-28-10-30.json
├─ 页面名称: mock-user-center.json
└─ 自定义名称
```

**文件变更**:
- [popup/popup.html](popup/popup.html) - 添加导出设置面板
- [popup/popup.js](popup/popup.js) - 导出选项逻辑
- [background.js:397-402](background.js#L397-L402) - 扩展 EXPORT_DATA 消息处理

---

#### 3. 请求筛选功能
**目标**: 减少噪音，只记录需要的请求

**实现内容**:
```
录制时过滤:
├─ URL 关键词白名单/黑名单
├─ 域名过滤 (只记录 api.example.com)
├─ 状态码过滤 (排除 404/5xx)
└─ 请求类型过滤 (只记录 XHR/fetch)

导出时筛选:
├─ 按服务多选
├─ 按状态码筛选
├─ 时间范围选择
└─ 关键词搜索
```

**文件变更**:
- [background.js](background.js) - 添加过滤逻辑
- [popup/popup.html](popup/popup.html) - 筛选面板 UI
- [popup/popup.js](popup/popup.js) - 筛选逻辑
- [manifest.json](manifest.json) - 添加存储权限（保存筛选规则）

---

### 阶段二：高级功能（提升体验）

#### 4. 请求编辑与回放
**目标**: 修改并重新发送请求，方便调试

**实现内容**:
```
请求详情面板:
├─ Headers 查看/编辑
├─ Body 编辑 (支持 JSON 表单)
├─ Query 参数修改
└─ 重新发送按钮

响应对比:
├─ 并排对比两次响应
├─ Diff 高亮差异
└─ 响应时间统计
```

**文件变更**:
- 新增 `popup/request-detail.html` - 请求详情页
- 新增 `popup/request-detail.js` - 详情页逻辑
- 新增 `components/diff-viewer.js` - Diff 组件
- [background.js](background.js) - 添加 REPLAY_REQUEST 消息处理

---

#### 5. 环境变量支持
**目标**: 管理多个环境配置

**实现内容**:
```
环境管理:
├─ 开发环境 (dev)
├─ 测试环境 (test)
├─ 预发布环境 (staging)
└─ 生产环境 (prod)

变量替换:
├─ {{baseURL}} → https://api.example.com
├─ {{version}} → v1
└─ 自定义变量
```

**文件变更**:
- 新增 `stores/env-store.js` - 环境配置管理
- [popup/popup.html](popup/popup.html) - 环境选择器
- [background.js](background.js) - URL 变量替换逻辑

---

#### 6. 数据持久化与同步
**目标**: 更好的数据管理

**实现内容**:
```
存储升级:
├─ Chrome Storage → IndexedDB
├─ 支持大数据量 (10000+ 请求)
└─ 增量保存，防止丢失

会话管理:
├─ 保存录制会话
├─ 导入历史会话
├─ 会话备注与标签
└─ 快速恢复之前录制

可选同步:
├─ 导出配置文件
├─ 导入配置文件
└─ Gist 同步 (可选)
```

**文件变更**:
- 新增 `stores/indexeddb.js` - IndexedDB 封装
- [background.js](background.js) - 替换 chrome.storage
- [popup/popup.html](popup/popup.html) - 会话列表 UI

---

### 阶段三：企业级特性（生产就绪）

#### 7. 团队协作功能
**目标**: 团队共享 Mock 数据

**实现内容**:
```
共享方式:
├─ 导出为 Git 可追踪格式
├─ 生成可分享链接
└─ 导入他人数据

数据增强:
├─ 为接口添加注释
├─ 标记接口用途
└─ 关联相关需求/JIRA
```

---

#### 8. CI/CD 集成
**目标**: 自动化测试集成

**实现内容**:
```
命令行工具:
├─ npm package，提供 CLI
├─ 启动本地 Mock Server
├─ 生成测试数据集
└─ 与 Jest/Vitest 集成

Mock Server:
├─ 一键启动 msw server
├─ 支持动态路由
└─ 支持 CORS 配置
```

**文件变更**:
- 新增 `cli/` - 命令行工具
- 新增 `server/` - Mock Server
- 新增 `package.json` - npm 包配置

---

#### 9. 性能优化
**目标**: 支持大规模录制

**实现内容**:
```
UI 优化:
├─ 虚拟滚动 (1000+ 请求)
├─ 懒加载详情
└─ Web Worker 处理数据

数据处理:
├─ 增量导出
├─ 数据压缩 (gzip)
└─ 去重逻辑
```

---

## 优先级建议

### 🔥 高优先级（建议先做）
1. **Mock 数据格式优化** - 直接提升测试效率
2. **敏感数据脱敏** - 安全必需
3. **请求筛选功能** - 减少噪音，提升可用性

### ⚡ 中优先级（体验提升）
4. **导出选项增强** - 使用体验
5. **请求编辑与回放** - 方便调试
6. **数据持久化升级** - 支持大数据量

### 💡 低优先级（按需实现）
7. **环境变量支持** - 高级用户需求
8. **团队协作** - 看使用场景
9. **CI/CD 集成** - 企业级需求

---

## 命名建议

当前名称 "Network Request Monitor" 较通用，可选新名称：

| 名称 | 含义 | 风格 |
|------|------|------|
| **MockCatcher** | Mock 数据捕获器 | 生动 |
| **APIRecorder** | API 记录器 | 专业 |
| **ServiceSnatch** | 服务抓取工具 | 技术 |
| **MockMate** | Mock 伙伴 | 友好 |
| **NetCapture** | 网络捕获 | 简洁 |

---

## 下一步行动

如需实现改进，可选择：

1. **直接开始实现** - 告诉我从哪个功能开始
2. **进一步细化** - 选择某个阶段，生成详细的实现计划
3. **讨论技术方案** - 针对某个功能深入讨论实现细节
4. **其他想法** - 提出你的改进建议

---

*文档生成时间: 2025-02-28*
