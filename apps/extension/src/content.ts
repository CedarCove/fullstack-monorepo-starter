/**
 * Content script that runs on web pages
 * Can interact with the DOM and communicate with background/popup
 */

console.log('Grasp extension content script loaded');

// Example: Send message to background script
chrome.runtime.sendMessage({ type: 'CONTENT_LOADED' });

// Example: Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PAGE_INFO') {
    sendResponse({
      title: document.title,
      url: window.location.href,
    });
  }
});

export {};
