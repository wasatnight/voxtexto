const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('voxDesktop', {
  platform: process.platform,
  prepareCapture: () => ipcRenderer.invoke('capture:prepare'),
  releaseCapture: () => ipcRenderer.invoke('capture:release'),
  saveFile: (name, bytes) => ipcRenderer.invoke('file:save', {name,bytes}),
});
