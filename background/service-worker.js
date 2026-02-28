/**
 * ServiceSnatch - Service Worker
 * 后台服务主入口
 */

// 导入工具模块
importScripts(
  '../utils/service-detector.js',
  '../utils/url-parser.js',
  '../utils/exporter.js',
  'data-processor.js',
  'storage-manager.js',
  'network-monitor.js'
);

console.log('ServiceSnatch Service Worker initialized');

// 监听插件安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('ServiceSnatch extension installed');
});

// 监听消息来自 popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);

  if (request.action === 'getStatus') {
    // 返回当前状态
    chrome.storage.local.get(['isRecording', 'capturedRequests'], (result) => {
      sendResponse({
        isRecording: result.isRecording || false,
        count: result.capturedRequests?.length || 0
      });
    });
    return true;
  }

  if (request.action === 'clearData') {
    // 清空捕获的数据
    chrome.storage.local.set({ capturedRequests: [] }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
