/**
 * Background service worker for Chrome extension
 * Handles long-lived connections and background tasks
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('Grasp extension installed');
});

// Example: Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_TAB_INFO') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ tab: tabs[0] });
    });
    return true; // Will respond asynchronously
  }
});

export {};
