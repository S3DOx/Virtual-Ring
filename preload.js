const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Ring overlay methods
    showRingOverlay: (ringData) => ipcRenderer.invoke('show-ring-overlay', ringData),
    hideRingOverlay: () => ipcRenderer.invoke('hide-ring-overlay'),
    updateRingProperties: (properties) => ipcRenderer.invoke('update-ring-properties', properties),
    
    // Window control methods
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),
    
    // System control methods
    setBrightness: (value) => ipcRenderer.invoke('set-brightness', value),
    setRingSize: (value) => ipcRenderer.invoke('set-ring-size', value),
    setColorTemp: (value) => ipcRenderer.invoke('set-color-temp', value),
    
    // Mouse event control
    enableMouseEvents: () => ipcRenderer.invoke('enable-mouse-events'),
    disableMouseEvents: () => ipcRenderer.invoke('disable-mouse-events'),
    
    // System info
    getSystemInfo: () => {
        return {
            platform: process.platform,
            arch: process.arch,
            version: process.version,
            electron: process.versions.electron
        };
    },
    
    // Display management
    getDisplays: () => ipcRenderer.invoke('get-displays'),
    
    // External URL handling
    openExternal: (url) => ipcRenderer.invoke('open-external', url)
});

// Expose a safe API for the renderer process
contextBridge.exposeInMainWorld('appAPI', {
    // App-specific methods can be added here
    log: (message) => {
        // Logging disabled for production
    },
    
    // Get current window state
    getWindowState: () => {
        return {
            isMaximized: false, // This would need to be tracked
            isMinimized: false,
            isFullScreen: false
        };
    }
}); 