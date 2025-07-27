const { app, BrowserWindow, Menu, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { shell } = require('electron');

// Keep a global reference of the window object
let mainWindow;
let overlayWindows = new Map(); // Store overlay windows for each display

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 450,
        height: 550,
        minWidth: 400,
        minHeight: 500,
        frame: false, // Remove default window frame
        transparent: true, // Enable transparency
        resizable: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        show: false, // Don't show until ready
        titleBarStyle: 'hidden',
        vibrancy: 'dark', // macOS only
        visualEffectState: 'active'
    });

    // Load the index.html file
    mainWindow.loadFile('index.html');

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Add some nice entrance animation
        mainWindow.setOpacity(0);
        let opacity = 0;
        const fadeIn = setInterval(() => {
            opacity += 0.1;
            mainWindow.setOpacity(opacity);
            if (opacity >= 1) {
                clearInterval(fadeIn);
            }
        }, 20);
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Prevent new window creation
    mainWindow.webContents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
    });

    // Register global shortcuts
    registerGlobalShortcuts();
}

// Register global keyboard shortcuts
function registerGlobalShortcuts() {
    // Ctrl/Cmd + Q to quit
    globalShortcut.register('CommandOrControl+Q', () => {
        app.quit();
    });

    // Ctrl/Cmd + W to close window
    globalShortcut.register('CommandOrControl+W', () => {
        if (mainWindow) {
            mainWindow.close();
        }
    });

    // Ctrl/Cmd + R to reload
    globalShortcut.register('CommandOrControl+R', () => {
        if (mainWindow) {
            mainWindow.reload();
        }
    });

    // F11 to toggle fullscreen
    globalShortcut.register('F11', () => {
        if (mainWindow) {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
    });
}

// Create menu template
function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        // Handle new action
                    }
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' }
            ]
        }
    ];

    // Add macOS specific menu items
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
    createWindow();
    createMenu();

    app.on('activate', () => {
        // On macOS it's common to re-create a window when the dock icon is clicked
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // On macOS it's common for applications to stay open even when all windows are closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC handlers for window controls
ipcMain.handle('window-minimize', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.handle('window-close', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

ipcMain.handle('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

// Get target displays based on monitor selection
async function getTargetDisplays(monitorSelection) {
    const { screen } = require('electron');
    const displays = screen.getAllDisplays();
    let targetDisplays = [displays[0]]; // Default to primary
    
    if (monitorSelection) {
        if (monitorSelection === 'all') {
            targetDisplays = displays;
        } else if (monitorSelection.startsWith('display_')) {
            const displayIndex = parseInt(monitorSelection.split('_')[1]);
            if (displayIndex >= 0 && displayIndex < displays.length) {
                targetDisplays = [displays[displayIndex]];
            }
        }
        // 'primary' is already handled by default
    }
    
    return targetDisplays;
}

// Ring overlay IPC handlers
ipcMain.handle('show-ring-overlay', async (event, ringData) => {
    try {
        // Get target displays based on monitor selection
        const targetDisplays = await getTargetDisplays(ringData?.monitor || 'primary');
        
        // Create overlay window for each target display
        for (let i = 0; i < targetDisplays.length; i++) {
            const display = targetDisplays[i];
            const { width, height, x, y } = display.bounds;
            
            // Create overlay window
            const overlayWindow = new BrowserWindow({
                width: width,
                height: height,
                x: x,
                y: y,
                frame: false,
                transparent: true,
                alwaysOnTop: true,
                skipTaskbar: true,
                focusable: false,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    enableRemoteModule: false
                },
                show: false,
                hasShadow: false,
                thickFrame: false,
            });

            // Forward mouse events to other windows by default
            overlayWindow.setIgnoreMouseEvents(true, { forward: true });

            // Load overlay HTML
            overlayWindow.loadFile('overlay.html');

            // Show overlay when ready
            overlayWindow.once('ready-to-show', () => {
                overlayWindow.show();
                overlayWindow.setAlwaysOnTop(true, 'screen-saver');
                
                // Enable console output from overlay window
                overlayWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
                    console.log(`[Overlay ${i + 1}] ${message}`);
                });
                
                // Send initial properties
                setTimeout(() => {
                    // Check if window still exists before sending
                    if (overlayWindow && !overlayWindow.isDestroyed()) {
                        overlayWindow.webContents.send('update-ring', { 
                            thickness: ringData?.thickness || 50, 
                            brightness: ringData?.brightness || 100,
                            warmth: ringData?.warmth || 50,
                            color: ringData?.color || 'rgba(255, 255, 255, 0.9)',
                            size: ringData?.size || 25
                        });
                    } else {
                        console.log(`Overlay window ${i + 1} was destroyed before initial properties could be sent`);
                    }
                }, 500);
            });

            // Add error handling
            overlayWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
                console.error(`Overlay window ${i + 1} failed to load:`, errorDescription);
            });

            overlayWindow.on('closed', () => {
                console.log(`Overlay window ${i + 1} closed`);
            });

            // Store the window reference
            overlayWindows.set(i, overlayWindow);
        }

        return { success: true, displays: targetDisplays.length };
    } catch (error) {
        console.error('Error creating ring overlay:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('hide-ring-overlay', async (event) => {
    try {
        overlayWindows.forEach((window, index) => {
            if (window && !window.isDestroyed()) {
                window.close();
            }
        });
        overlayWindows.clear();
        
        return { success: true };
    } catch (error) {
        console.error('Error hiding ring overlay:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update-ring-properties', async (event, properties) => {
    try {
        let updatedCount = 0;
        
        overlayWindows.forEach((window, index) => {
            if (window && !window.isDestroyed()) {
                window.webContents.send('update-ring', properties);
                updatedCount++;
            }
        });
        
        return { success: true, updatedCount };
    } catch (error) {
        console.error('Error updating ring properties:', error);
        return { success: false, error: error.message };
    }
});

// Mouse event control handlers
ipcMain.handle('enable-mouse-events', async (event) => {
    try {
        overlayWindows.forEach((window, index) => {
            if (window && !window.isDestroyed()) {
                window.setIgnoreMouseEvents(false);
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Error enabling mouse events:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('disable-mouse-events', async (event) => {
    try {
        overlayWindows.forEach((window, index) => {
            if (window && !window.isDestroyed()) {
                window.setIgnoreMouseEvents(true, { forward: true });
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Error disabling mouse events:', error);
        return { success: false, error: error.message };
    }
});

// Display info handler
ipcMain.handle('get-displays', async (event) => {
    try {
        const { screen } = require('electron');
        const displays = screen.getAllDisplays();
        return {
            success: true,
            displays: displays.map((display, index) => ({
                id: index,
                bounds: display.bounds,
                size: display.size,
                isPrimary: display.id === screen.getPrimaryDisplay().id
            }))
        };
    } catch (error) {
        console.error('Error getting displays:', error);
        return { success: false, error: error.message };
    }
});

// System control IPC handlers
ipcMain.handle('set-brightness', async (event, value) => {
    try {
        // Convert percentage to brightness level (0-100)
        const brightness = Math.round(value);
        
        // In a real Electron app, you would use native APIs here
        // For now, we'll simulate the control
        if (process.platform === 'win32') {
            // Windows brightness control (requires additional setup)
            // This is a placeholder for actual implementation
        } else if (process.platform === 'darwin') {
            // macOS brightness control
            // This is a placeholder for actual implementation
        } else {
            // Linux brightness control
            // This is a placeholder for actual implementation
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error setting brightness:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('set-ring-size', async (event, value) => {
    try {
        // Convert percentage to ring size (0-100)
        const ringSize = Math.round(value);
        
        // This would update the ring size in the overlay
        // For now, just return success
        return { success: true };
    } catch (error) {
        console.error('Error setting ring size:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('set-color-temp', async (event, value) => {
    try {
        // Convert percentage to color temperature (warm to cool)
        const temp = Math.round(value);
        
        // This would update the color temperature in the overlay
        // For now, just return success
        return { success: true };
    } catch (error) {
        console.error('Error setting color temperature:', error);
        return { success: false, error: error.message };
    }
});

// Handle window controls
ipcMain.handle('minimize-window', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
    return { success: true };
});

ipcMain.handle('close-window', () => {
    if (mainWindow) {
        mainWindow.close();
    }
    return { success: true };
});

// Handle external URL opening
ipcMain.handle('open-external', async (event, url) => {
    try {
        await shell.openExternal(url);
        return { success: true };
    } catch (error) {
        console.error('Error opening external URL:', error);
        return { success: false, error: error.message };
    }
});

// Handle app quit
app.on('before-quit', () => {
    // Clean up any resources
    globalShortcut.unregisterAll();
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        if (parsedUrl.origin !== 'file://') {
            event.preventDefault();
        }
    });
}); 