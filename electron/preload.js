const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppName: () => ipcRenderer.invoke('get-app-name'),
  
  // File operations
  openFolder: (callback) => ipcRenderer.on('open-folder', callback),
  newScan: (callback) => ipcRenderer.on('new-scan', callback),
  
  // Error handling
  onError: (callback) => ipcRenderer.on('error', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Expose some APIs to the renderer process
contextBridge.exposeInMainWorld('platform', {
  isElectron: true,
  platform: process.platform,
  arch: process.arch
});

// Log khi preload script được load
console.log('Preload script loaded successfully');

