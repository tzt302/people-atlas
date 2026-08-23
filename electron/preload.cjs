const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopUpdater', {
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  checkNow: () => ipcRenderer.invoke('check-for-updates'),
  onStatus: callback => ipcRenderer.on('update-status', (_event, status) => callback(status))
});
