/**
 * ServiceSnatch - Popup 主逻辑
 */

// DOM 元素
const recordBtn = document.getElementById('recordBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const requestCount = document.getElementById('requestCount');
const recordingIndicator = document.getElementById('recordingIndicator');
const recordingMethods = document.getElementById('recordingMethods');
const requestList = document.getElementById('requestList');
const settingsBtn = document.getElementById('settingsBtn');
const methodFilters = document.getElementById('methodFilters');
const serviceFilterInput = document.getElementById('serviceFilter');

// 弹窗元素
const requestModal = document.getElementById('requestModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const copyRequestBtn = document.getElementById('copyRequestBtn');
const copyResponseBtn = document.getElementById('copyResponseBtn');
const copyAllBtn = document.getElementById('copyAllBtn');

// 设置弹窗元素
const settingsModal = document.getElementById('settingsModal');
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsClose = document.getElementById('settingsClose');
const filenameTemplate = document.getElementById('filenameTemplate');
const filterStaticResources = document.getElementById('filterStaticResources');
const exportFormat = document.getElementById('exportFormat');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');
const selectDirectoryBtn = document.getElementById('selectDirectoryBtn');
const directoryStatus = document.getElementById('directoryStatus');
const clearDirectoryBtn = document.getElementById('clearDirectoryBtn');

// 状态
let isRecording = false;
let capturedRequests = [];
let selectedMethods = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
let serviceFilter = '';
let currentRequest = null; // 当前查看的请求
let exportDirectoryHandle = null; // 导出目录句柄

// 默认设置
const defaultSettings = {
  filenameTemplate: '{request_type}_{timestamp}.json',
  filterStaticResources: true,
  exportFormat: 'standard'
};

// 加载的设置
let settings = { ...defaultSettings };

// 初始化
async function init() {
  await loadSettings();
  await loadFilterSettings();
  await updateStatus();
  await loadRequests();

  // 绑定事件
  recordBtn.addEventListener('click', toggleRecording);
  clearBtn.addEventListener('click', clearData);
  exportBtn.addEventListener('click', exportData);
  settingsBtn.addEventListener('click', openSettingsModal);

  // 绑定筛选器事件
  methodFilters.addEventListener('change', handleFilterChange);
  serviceFilterInput.addEventListener('input', handleServiceFilterChange);

  // 绑定弹窗事件
  modalOverlay.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  copyRequestBtn.addEventListener('click', () => copyToClipboard('request'));
  copyResponseBtn.addEventListener('click', () => copyToClipboard('response'));
  copyAllBtn.addEventListener('click', () => copyToClipboard('all'));

  // 绑定设置弹窗事件
  settingsOverlay.addEventListener('click', closeSettingsModal);
  settingsClose.addEventListener('click', closeSettingsModal);
  saveSettingsBtn.addEventListener('click', saveSettings);
  resetSettingsBtn.addEventListener('click', resetSettings);

  // 绑定目录选择事件
  selectDirectoryBtn.addEventListener('click', selectDirectory);
  clearDirectoryBtn.addEventListener('click', clearDirectory);
}

// 加载筛选设置
async function loadFilterSettings() {
  chrome.storage.local.get(['filterMethods', 'serviceFilter'], (result) => {
    if (result.filterMethods) {
      selectedMethods = new Set(result.filterMethods);

      // 更新复选框状态
      methodFilters.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = selectedMethods.has(checkbox.value);
      });
    }

    if (result.serviceFilter) {
      serviceFilter = result.serviceFilter;
      serviceFilterInput.value = serviceFilter;
    }
  });
}

// 保存筛选设置
async function saveFilterSettings() {
  chrome.storage.local.set({
    filterMethods: Array.from(selectedMethods),
    serviceFilter: serviceFilter
  });
}

// 处理筛选变化
function handleFilterChange(e) {
  if (e.target.type === 'checkbox') {
    const method = e.target.value;

    if (e.target.checked) {
      selectedMethods.add(method);
    } else {
      selectedMethods.delete(method);
    }

    saveFilterSettings();

    // 通知 background 更新筛选设置（实时录制）
    chrome.runtime.sendMessage({
      action: 'updateFilterMethods',
      filterMethods: Array.from(selectedMethods)
    });

    renderRequests();
  }
}

// 处理服务名称筛选变化
function handleServiceFilterChange(e) {
  serviceFilter = e.target.value.trim().toLowerCase();
  saveFilterSettings();
  renderRequests();
}

// 获取筛选后的请求
function getFilteredRequests() {
  let filtered = capturedRequests;

  // 按方法筛选
  if (selectedMethods.size === 0) {
    filtered = [];
  } else {
    filtered = filtered.filter(req => selectedMethods.has(req.method));
  }

  // 按服务名称筛选
  if (serviceFilter) {
    filtered = filtered.filter(req => {
      const serviceName = (req.serviceName || 'unknown').toLowerCase();
      return serviceName.includes(serviceFilter);
    });
  }

  return filtered;
}

// 更新状态
async function updateStatus() {
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    if (response) {
      isRecording = response.isRecording;
      updateRecordingUI();
    }
  });
}

// 加载请求数据
async function loadRequests() {
  chrome.storage.local.get(['capturedRequests'], (result) => {
    capturedRequests = result.capturedRequests || [];
    updateRequestCount();
    renderRequests();
  });
}

// 切换录制状态
async function toggleRecording() {
  isRecording = !isRecording;

  await chrome.storage.local.set({ isRecording });

  // 通知 background 开始/停止录制
  chrome.runtime.sendMessage({
    action: isRecording ? 'startRecording' : 'stopRecording'
  });

  updateRecordingUI();
}

// 更新录制 UI
function updateRecordingUI() {
  const btnIcon = recordBtn.querySelector('.btn-icon');
  const btnText = recordBtn.querySelector('.btn-text');

  if (isRecording) {
    recordBtn.classList.add('recording');
    btnIcon.textContent = '⏹️';
    btnText.textContent = '停止录制';
    recordingIndicator.classList.add('active');

    // 显示正在录制的方法类型
    updateRecordingMethods();
  } else {
    recordBtn.classList.remove('recording');
    btnIcon.textContent = '▶️';
    btnText.textContent = '开始录制';
    recordingIndicator.classList.remove('active');
    recordingMethods.textContent = '';
  }
}

/**
 * 更新录制方法指示器
 */
function updateRecordingMethods() {
  if (!isRecording || selectedMethods.size === 0) {
    recordingMethods.textContent = '';
    return;
  }

  const methods = Array.from(selectedMethods).sort();
  recordingMethods.innerHTML = methods.map(method =>
    `<span class="recording-method-badge method-tag ${method}">${method}</span>`
  ).join('');
}

// 更新请求计数
function updateRequestCount() {
  requestCount.textContent = capturedRequests.length;
  exportBtn.disabled = capturedRequests.length === 0;
}

// 渲染请求列表
function renderRequests() {
  const filteredRequests = getFilteredRequests();

  if (filteredRequests.length === 0) {
    if (capturedRequests.length === 0) {
      requestList.innerHTML = `
        <div class="empty-state">
          <p>点击"开始录制"捕获网络请求</p>
        </div>
      `;
    } else {
      requestList.innerHTML = `
        <div class="empty-state">
          <p>没有符合筛选条件的请求</p>
        </div>
      `;
    }
    return;
  }

  // 按服务分组
  const grouped = groupByService(filteredRequests);

  // 渲染服务分组
  let html = '';
  for (const [serviceName, requests] of Object.entries(grouped)) {
    html += `
      <div class="service-group">
        <div class="service-header" data-service="${serviceName}">
          <div class="service-name">
            <span class="service-toggle">▶</span>
            <span>${serviceName}</span>
          </div>
          <span class="service-count">${requests.length}</span>
        </div>
        <div class="service-requests">
    `;

    for (const req of requests) {
      const statusClass = req.status >= 200 && req.status < 300 ? 'success' : 'error';
      const requestIndex = capturedRequests.findIndex(r => r.requestId === req.requestId);
      html += `
        <div class="request-item" data-request-index="${requestIndex}">
          <span class="method ${req.method}">${req.method}</span>
          <span class="url" title="${req.url}">${req.url}</span>
          <span class="status ${statusClass}">${req.status}</span>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;
  }

  requestList.innerHTML = html;

  // 绑定展开/收起事件
  document.querySelectorAll('.service-header').forEach(header => {
    header.addEventListener('click', () => {
      const toggle = header.querySelector('.service-toggle');
      const requests = header.nextElementSibling;

      toggle.classList.toggle('expanded');
      requests.classList.toggle('expanded');
    });
  });

  // 绑定请求项点击事件
  document.querySelectorAll('.request-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const index = parseInt(item.dataset.requestIndex);
      if (!isNaN(index)) {
        openRequestModal(capturedRequests[index]);
      }
    });
  });
}

// 按服务分组
function groupByService(requests) {
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

// 清空数据
async function clearData() {
  if (!confirm('确定要清空所有捕获的请求吗？')) {
    return;
  }

  chrome.runtime.sendMessage({ action: 'clearData' }, () => {
    capturedRequests = [];
    updateRequestCount();
    renderRequests();
  });
}

// 导出数据
async function exportData() {
  const filteredRequests = getFilteredRequests();

  if (filteredRequests.length === 0) {
    alert('没有可导出的数据');
    return;
  }

  // 确定主要请求类型和服务名称（用于文件名）
  const requestMethods = [...new Set(filteredRequests.map(req => req.method))];
  const primaryRequestType = requestMethods.length === 1 ? requestMethods[0] : 'MIXED';
  const serviceNames = [...new Set(filteredRequests.map(req => req.serviceName))];
  const primaryService = serviceNames.length === 1 ? serviceNames[0] : 'all';

  // 生成导出数据
  const exportContent = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    source: await getCurrentTabUrl(),
    mocks: filteredRequests.map(req => {
      const urlObj = new URL(req.url);
      const mock = {
        service: req.serviceName,
        endpoint: urlObj.pathname,
        method: req.method,
        query: Object.fromEntries(urlObj.searchParams),
        response: {
          status: req.status,
          data: req.responseData
        }
      };

      // 添加请求体（如果有）
      if (req.postData) {
        try {
          mock.request = JSON.parse(req.postData);
        } catch (e) {
          mock.request = req.postData;
        }
      }

      // 添加请求头（可选）
      if (req.headers) {
        mock.headers = req.headers;
      }

      return mock;
    })
  };

  // 根据导出格式调整数据
  let finalData = exportContent;
  if (settings.exportFormat === 'simple') {
    // 简化格式：只保留核心信息
    finalData = exportContent.mocks;
  } else if (settings.exportFormat === 'mock') {
    // Mock 格式：更适合 Mock 服务器
    finalData = {};
    exportContent.mocks.forEach(mock => {
      const key = `${mock.method}:${mock.endpoint}`;
      finalData[key] = {
        request: mock.request || {},
        response: mock.response
      };
    });
  }

  // 生成文件名
  const filename = generateFilename(primaryRequestType, primaryService);

  // 生成文件内容
  const jsonContent = JSON.stringify(finalData, null, 2);

  // 如果有保存的目录，使用 File System Access API 保存
  if (exportDirectoryHandle && self.DirectoryStorage) {
    try {
      await self.DirectoryStorage.createFile(exportDirectoryHandle, filename, jsonContent);
      showToast(`已导出到 ${exportDirectoryHandle.name}/${filename}`);
      return;
    } catch (e) {
      console.error('Failed to save to directory:', e);
      // 如果保存失败，提示用户并使用默认下载方式
      if (!confirm(`无法保存到选择的目录 (${e.message})。\n\n是否使用默认下载位置？`)) {
        return;
      }
    }
  }

  // 默认下载方式
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 获取当前标签页 URL
async function getCurrentTabUrl() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]?.url || 'unknown');
    });
  });
}

// 监听 storage 变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.capturedRequests) {
    capturedRequests = changes.capturedRequests.newValue || [];
    updateRequestCount();
    renderRequests();
  }
});

// ============ 请求详情弹窗相关函数 ============

/**
 * 打开请求详情弹窗
 */
function openRequestModal(req) {
  currentRequest = req;
  const urlObj = new URL(req.url);

  // 设置标题
  modalTitle.textContent = `${req.method} ${urlObj.pathname}`;

  // 渲染详情内容
  modalBody.innerHTML = `
    ${renderDetailSection('基本信息', renderBasicInfo(req))}
    ${renderDetailSection('请求头', req.headers ? renderHeaders(req.headers) : '无')}
    ${req.postData ? renderDetailSection('请求体', renderRequestBody(req.postData)) : ''}
    ${renderDetailSection('响应状态', renderResponseStatus(req))}
    ${renderDetailSection('响应数据', renderResponseData(req.responseData))}
  `;

  // 显示弹窗
  requestModal.classList.add('active');
}

/**
 * 关闭弹窗
 */
function closeModal() {
  requestModal.classList.remove('active');
  currentRequest = null;
}

/**
 * 渲染详情区块
 */
function renderDetailSection(label, content) {
  return `
    <div class="detail-section">
      <div class="detail-label">${label}</div>
      <div class="detail-content">${content}</div>
    </div>
  `;
}

/**
 * 渲染基本信息
 */
function renderBasicInfo(req) {
  return `
    <div class="detail-row">
      <span class="detail-key">方法:</span>
      <span class="detail-value method ${req.method}">${req.method}</span>
    </div>
    <div class="detail-row">
      <span class="detail-key">URL:</span>
      <span class="detail-value">${req.url}</span>
    </div>
    <div class="detail-row">
      <span class="detail-key">服务:</span>
      <span class="detail-value">${req.serviceName || 'unknown'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-key">时间:</span>
      <span class="detail-value">${new Date(req.timestamp).toLocaleString()}</span>
    </div>
  `;
}

/**
 * 渲染请求头
 */
function renderHeaders(headers) {
  if (typeof headers === 'string') {
    return `<pre>${escapeHtml(headers)}</pre>`;
  }
  let html = '<div class="detail-rows">';
  for (const [key, value] of Object.entries(headers)) {
    html += `
      <div class="detail-row">
        <span class="detail-key">${escapeHtml(key)}:</span>
        <span class="detail-value">${escapeHtml(String(value))}</span>
      </div>
    `;
  }
  html += '</div>';
  return html;
}

/**
 * 渲染请求体
 */
function renderRequestBody(postData) {
  try {
    const parsed = JSON.parse(postData);
    return `<pre>${JSON.stringify(parsed, null, 2)}</pre>`;
  } catch (e) {
    return `<pre>${escapeHtml(postData)}</pre>`;
  }
}

/**
 * 渲染响应状态
 */
function renderResponseStatus(req) {
  const statusClass = req.status >= 200 && req.status < 300 ? 'success' : 'error';
  return `
    <div class="detail-row">
      <span class="detail-key">状态码:</span>
      <span class="detail-value ${statusClass}">${req.status}</span>
    </div>
    ${req.mimeType ? `
      <div class="detail-row">
        <span class="detail-key">类型:</span>
        <span class="detail-value">${req.mimeType}</span>
      </div>
    ` : ''}
  `;
}

/**
 * 渲染响应数据
 */
function renderResponseData(data) {
  if (data === null || data === undefined) {
    return '<span style="color: var(--text-secondary);">无响应数据</span>';
  }
  if (typeof data === 'object') {
    return `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }
  return `<pre>${escapeHtml(String(data))}</pre>`;
}

/**
 * 复制到剪贴板
 */
async function copyToClipboard(type) {
  if (!currentRequest) return;

  let content = '';
  const urlObj = new URL(currentRequest.url);

  switch (type) {
    case 'request':
      content = {
        method: currentRequest.method,
        url: currentRequest.url,
        endpoint: urlObj.pathname,
        service: currentRequest.serviceName,
        headers: currentRequest.headers,
        body: currentRequest.postData ? tryParseJSON(currentRequest.postData) : null
      };
      break;

    case 'response':
      content = {
        status: currentRequest.status,
        data: currentRequest.responseData
      };
      break;

    case 'all':
      content = {
        service: currentRequest.serviceName,
        endpoint: urlObj.pathname,
        method: currentRequest.method,
        query: Object.fromEntries(urlObj.searchParams),
        request: currentRequest.postData ? tryParseJSON(currentRequest.postData) : null,
        response: {
          status: currentRequest.status,
          data: currentRequest.responseData
        }
      };
      break;
  }

  const text = JSON.stringify(content, null, 2);

  try {
    await navigator.clipboard.writeText(text);
    showToast('复制成功！');
  } catch (err) {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('复制成功！');
    } catch (e) {
      showToast('复制失败', true);
    }
    document.body.removeChild(textarea);
  }
}

/**
 * 尝试解析 JSON
 */
function tryParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 显示提示消息
 */
function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  if (isError) {
    toast.style.background = 'var(--danger-color)';
  }
  document.body.appendChild(toast);

  // 触发动画
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2000);
}

// ============ 设置相关函数 ============

/**
 * 加载设置
 */
async function loadSettings() {
  // 加载导出目录
  await loadExportDirectory();

  return new Promise((resolve) => {
    chrome.storage.local.get(['exportSettings'], (result) => {
      if (result.exportSettings) {
        settings = { ...defaultSettings, ...result.exportSettings };
      }

      // 更新 UI
      filenameTemplate.value = settings.filenameTemplate;
      filterStaticResources.checked = settings.filterStaticResources;
      exportFormat.value = settings.exportFormat;

      resolve();
    });
  });
}

/**
 * 加载导出目录
 */
async function loadExportDirectory() {
  try {
    if (self.DirectoryStorage) {
      const handle = await self.DirectoryStorage.getDirectory('exportDirectory');
      if (handle && await self.DirectoryStorage.verifyHandle(handle)) {
        exportDirectoryHandle = handle;
        updateDirectoryStatus(handle.name);
      } else {
        updateDirectoryStatus(null);
      }
    }
  } catch (e) {
    console.log('No saved directory found:', e);
    updateDirectoryStatus(null);
  }
}

/**
 * 更新目录状态显示
 */
function updateDirectoryStatus(directoryName) {
  if (directoryName) {
    directoryStatus.textContent = `📂 ${directoryName}`;
    directoryStatus.title = directoryName;
    clearDirectoryBtn.style.display = 'inline-block';
  } else {
    directoryStatus.textContent = '未选择目录';
    directoryStatus.title = '';
    clearDirectoryBtn.style.display = 'none';
  }
}

/**
 * 选择目录
 */
async function selectDirectory() {
  try {
    // 检查浏览器是否支持 File System Access API
    if (!('showDirectoryPicker' in window)) {
      alert('您的浏览器不支持目录选择功能，请使用最新版本的 Chrome 或 Edge。');
      return;
    }

    // 让用户选择目录
    const handle = await window.showDirectoryPicker();

    if (handle) {
      exportDirectoryHandle = handle;

      // 保存目录句柄
      if (self.DirectoryStorage) {
        await self.DirectoryStorage.saveDirectory('exportDirectory', handle);
      }

      // 更新 UI
      updateDirectoryStatus(handle.name);
      showToast(`已选择目录: ${handle.name}`);
    }
  } catch (e) {
    // 用户取消了选择
    if (e.name !== 'AbortError') {
      console.error('Directory selection error:', e);
      showToast('目录选择失败', true);
    }
  }
}

/**
 * 清除目录
 */
async function clearDirectory() {
  if (!confirm('确定要清除保存的目录吗？')) {
    return;
  }

  exportDirectoryHandle = null;

  // 从存储中删除
  if (self.DirectoryStorage) {
    await self.DirectoryStorage.deleteDirectory('exportDirectory');
  }

  // 更新 UI
  updateDirectoryStatus(null);
  showToast('已清除目录设置');
}

/**
 * 打开设置弹窗
 */
function openSettingsModal() {
  settingsModal.classList.add('active');
}

/**
 * 关闭设置弹窗
 */
function closeSettingsModal() {
  settingsModal.classList.remove('active');
}

/**
 * 保存设置
 */
function saveSettings() {
  settings = {
    filenameTemplate: filenameTemplate.value.trim() || defaultSettings.filenameTemplate,
    filterStaticResources: filterStaticResources.checked,
    exportFormat: exportFormat.value
  };

  chrome.storage.local.set({ exportSettings: settings }, () => {
    showToast('设置已保存！');
    closeSettingsModal();

    // 通知 background 更新设置
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: settings
    });
  });
}

/**
 * 重置设置
 */
function resetSettings() {
  if (!confirm('确定要重置所有设置为默认值吗？')) {
    return;
  }

  settings = { ...defaultSettings };

  // 更新 UI
  filenameTemplate.value = settings.filenameTemplate;
  filterStaticResources.checked = settings.filterStaticResources;
  exportFormat.value = settings.exportFormat;

  showToast('设置已重置');
}

/**
 * 生成文件名
 */
function generateFilename(requestType = 'MIXED', serviceName = null) {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');

  let filename = settings.filenameTemplate;

  // 替换变量
  filename = filename.replace('{date}', date);
  filename = filename.replace('{time}', time);
  filename = filename.replace('{timestamp}', Date.now());
  filename = filename.replace('{service}', serviceName || 'all');
  filename = filename.replace('{request_type}', requestType.toLowerCase());

  // 确保文件名以 .json 结尾
  if (!filename.endsWith('.json')) {
    filename += '.json';
  }

  return filename;
}

// 初始化
init();
