class RingControlApp {
    constructor() {
        this.sliders = {};
        this.powerState = false; // Start with power OFF
        this.isElectron = typeof window !== 'undefined' && window.electronAPI;
        this.debounceTimers = {}; // Store debounce timers for each slider
        this.debounceDelay = 500; // 500ms delay before applying system control
        this.isInitializing = true; // Flag to prevent system calls during initialization
        this.ringOverlay = null;
        this.ring = null;
        this.init();
        this.isInitializing = false; // Set to false after initialization
    }

    init() {
        this.initializeRing();
        this.initializeSliders();
        this.initializePowerButton();
        this.initializeWindowControls();
        this.initializeMonitorSelection();
        this.setupEventListeners();
        this.initializeElectronFeatures();
    }

    initializeRing() {
        this.ringOverlay = document.getElementById('ring-overlay');
        this.ring = document.getElementById('ring');
        
        console.log('Ring elements found:', { ringOverlay: this.ringOverlay, ring: this.ring });
        
        // Initially hide the ring
        if (this.ringOverlay) {
            this.ringOverlay.classList.remove('visible');
            console.log('Ring overlay initialized and hidden');
        } else {
            console.error('Ring overlay element not found!');
        }
    }

    initializeSliders() {
        const sliderConfigs = {
            'brightness': {
                thumb: document.getElementById('brightness-thumb'),
                track: document.getElementById('brightness-thumb').parentElement,
                fill: document.getElementById('brightness-fill'),
                value: document.getElementById('brightness-value'),
                isVertical: true,
                systemControl: 'brightness',
                defaultValue: 100
            },
            'thickness': {
                thumb: document.getElementById('thickness-thumb'),
                track: document.getElementById('thickness-thumb').parentElement,
                fill: document.getElementById('thickness-fill'),
                value: document.getElementById('thickness-value'),
                isVertical: true,
                systemControl: 'thickness',
                defaultValue: 50
            },
            'size': {
                thumb: document.getElementById('size-thumb'),
                track: document.getElementById('size-thumb').parentElement,
                fill: document.getElementById('size-fill'),
                value: document.getElementById('size-value'),
                isVertical: false,
                systemControl: 'ringSize',
                defaultValue: 25
            },
            'warmth': {
                thumb: document.getElementById('warmth-thumb'),
                track: document.getElementById('warmth-thumb').parentElement,
                fill: null, // SVG-based slider doesn't have a fill element
                value: document.getElementById('warmth-value'),
                isVertical: false,
                systemControl: 'colorTemp',
                defaultValue: 50
            }
        };

        Object.keys(sliderConfigs).forEach(configId => {
            const config = sliderConfigs[configId];
            
            this.sliders[configId] = {
                thumb: config.thumb,
                fill: config.fill, // May be null for horizontal slider
                value: config.value,
                track: config.track,
                currentValue: config.defaultValue,
                isDragging: false,
                isVertical: config.isVertical,
                systemControl: config.systemControl
            };
            
            this.updateSlider(configId, this.sliders[configId].currentValue);
        });
    }

    initializePowerButton() {
        this.powerButton = document.getElementById('power-btn');
        this.powerStatus = document.querySelector('.power-status');
        
        // Set initial state to OFF
        this.powerButton.classList.remove('active');
        this.powerStatus.textContent = 'OFF';
        this.powerStatus.style.color = '#ffffff';
        
        // Disable sliders initially since power is OFF
        this.disableSliders();
        
        this.powerButton.addEventListener('click', () => this.togglePower());
    }

    initializeWindowControls() {
        const minimizeBtn = document.getElementById('minimize-btn');
        const closeBtn = document.getElementById('close-btn');
        const settingsBtn = document.getElementById('settings-btn');


        minimizeBtn.addEventListener('click', () => {
            this.minimizeWindow();
        });

        closeBtn.addEventListener('click', () => {
            this.closeWindow();
        });

        settingsBtn.addEventListener('click', () => {
            this.openSettings();
        });

    }

    initializeMonitorSelection() {
        this.monitorSelect = document.getElementById('monitor-select');
        this.selectedMonitor = 'primary'; // Default to primary display
        
        // Load saved monitor preference
        const savedMonitor = localStorage.getItem('ringApp_monitor');
        if (savedMonitor) {
            this.selectedMonitor = savedMonitor;
            this.monitorSelect.value = savedMonitor;
        }
        
        // Populate monitor options if in Electron
        if (this.isElectron && window.electronAPI) {
            this.populateMonitorOptions();
        }
        
        this.monitorSelect.addEventListener('change', (e) => {
            this.selectedMonitor = e.target.value;
            localStorage.setItem('ringApp_monitor', this.selectedMonitor);
            console.log(`Monitor selection changed to: ${this.selectedMonitor}`);
            
            // If ring is currently active, restart it with new monitor selection
            if (this.powerState) {
                this.hideRing();
                setTimeout(() => {
                    this.showRing();
                }, 100);
            }
        });
    }





    async populateMonitorOptions() {
        try {
            const result = await window.electronAPI.getDisplays();
            if (result.success && result.displays.length > 1) {
                // Clear existing options
                this.monitorSelect.innerHTML = '';
                
                // Add primary display option
                const primaryOption = document.createElement('option');
                primaryOption.value = 'primary';
                primaryOption.textContent = 'Primary Display';
                this.monitorSelect.appendChild(primaryOption);
                
                // Add all displays option
                const allOption = document.createElement('option');
                allOption.value = 'all';
                allOption.textContent = `All Displays (${result.displays.length})`;
                this.monitorSelect.appendChild(allOption);
                
                // Add individual display options
                result.displays.forEach((display, index) => {
                    const option = document.createElement('option');
                    option.value = `display_${index}`;
                    option.textContent = `Display ${index + 1} (${display.size.width}x${display.size.height})`;
                    this.monitorSelect.appendChild(option);
                });
                
                // Restore saved selection
                if (this.selectedMonitor) {
                    this.monitorSelect.value = this.selectedMonitor;
                }
                
                console.log(`Populated monitor options with ${result.displays.length} display(s)`);
            }
        } catch (error) {
            console.error('Error populating monitor options:', error);
        }
    }

    initializeElectronFeatures() {
        if (this.isElectron) {
            // Log app info
            const systemInfo = window.electronAPI.getSystemInfo();
            console.log('Running in Electron:', systemInfo);
            
            // Add keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + Q to quit
                if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
                    e.preventDefault();
                    window.electronAPI.closeWindow();
                }
                
                // Ctrl/Cmd + W to close window
                if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
                    e.preventDefault();
                    window.electronAPI.closeWindow();
                }
                
                // F11 to toggle fullscreen
                if (e.key === 'F11') {
                    e.preventDefault();
                    window.electronAPI.maximizeWindow();
                }
            });
        }
    }

    setupEventListeners() {
        // Setup slider event listeners
        Object.keys(this.sliders).forEach(sliderId => {
            const slider = this.sliders[sliderId];
            
            slider.track.addEventListener('mousedown', (e) => {
                this.startSliderDrag(e, sliderId);
            });

            slider.thumb.addEventListener('mousedown', (e) => {
                this.startSliderDrag(e, sliderId);
            });

            // Touch events for mobile
            slider.track.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.startSliderDrag(e.touches[0], sliderId);
            });

            slider.thumb.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.startSliderDrag(e.touches[0], sliderId);
            });
        });
    }

    startSliderDrag(event, sliderId) {
        if (!this.powerState) return; // Don't allow dragging when power is off
        
        const slider = this.sliders[sliderId];
        slider.isDragging = true;
        document.addEventListener('mousemove', (e) => this.updateSliderFromMouse(e, sliderId));
        document.addEventListener('mouseup', () => this.stopSliderDrag(sliderId));
    }

    updateSliderFromMouse(event, sliderId) {
        if (!this.powerState) return; // Don't allow updates when power is off
        
        const slider = this.sliders[sliderId];
        if (!slider.isDragging) return;

        const rect = slider.track.getBoundingClientRect();
        let value;

        if (slider.isVertical) {
            const y = event.clientY - rect.top;
            value = Math.max(0, Math.min(100, 100 - (y / rect.height * 100)));
        } else {
            const x = event.clientX - rect.left;
            value = Math.max(0, Math.min(100, (x / rect.width * 100)));
        }

        this.updateSlider(sliderId, value);
    }

    stopSliderDrag(sliderId) {
        if (!this.powerState) return; // Don't allow stopping when power is off
        
        const slider = this.sliders[sliderId];
        slider.isDragging = false;
        document.removeEventListener('mousemove', (e) => this.updateSliderFromMouse(e, sliderId));
        document.removeEventListener('mouseup', () => this.stopSliderDrag(sliderId));
        
        // Apply system control immediately when dragging stops
        this.applySystemControl(sliderId, slider.currentValue);
    }

    updateSlider(sliderId, value) {
        const slider = this.sliders[sliderId];
        slider.currentValue = value;
        
        // Update visual elements
        if (slider.isVertical) {
            if (slider.fill) {
                slider.fill.style.height = `${value}%`;
            }
            slider.thumb.style.top = `${100 - value}%`;
        } else {
            // For horizontal sliders, update both thumb position and fill
            slider.thumb.style.left = `${value}%`;
            if (slider.fill) {
                slider.fill.style.width = `${value}%`;
            }
        }
        
        if (slider.value) {
            if (sliderId === 'warmth') {
                // Show temperature description for warmth slider
                const tempLabel = this.getTemperatureLabel(value);
                slider.value.textContent = tempLabel;
            } else {
                slider.value.textContent = `${Math.round(value)}%`;
            }
        }
        
        // Update thumb color based on value
        if (slider.isVertical) {
            const hue = this.getValueHue(sliderId, value);
            slider.thumb.style.background = `hsl(${hue}, 70%, 50%)`;
            slider.thumb.style.boxShadow = `0 0 10px hsla(${hue}, 70%, 50%, 0.5)`;
        } else if (sliderId === 'warmth') {
            // Special handling for warmth slider - use color temperature
            const colorTemp = this.getColorTemperature(value);
            slider.thumb.style.background = colorTemp;
            slider.thumb.style.boxShadow = `0 0 15px ${colorTemp}, 0 0 30px ${colorTemp.replace('0.9', '0.4')}`;
        } else {
            // Keep other horizontal slider thumb bright green
            slider.thumb.style.background = '#00ff00';
            slider.thumb.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.8), 0 0 30px rgba(0, 255, 0, 0.4)';
        }
        
        // Update ring properties if power is on
        if (this.powerState) {
            console.log(`Slider ${sliderId} changed to ${value}%`);
            if (sliderId === 'thickness') {
                console.log('Updating ring thickness...');
                this.updateRingThickness();
            } else if (sliderId === 'brightness') {
                console.log('Updating ring brightness...');
                this.updateRingBrightness();
            } else if (sliderId === 'size') {
                console.log('Updating ring size...');
                this.updateRingSize();
            } else if (sliderId === 'warmth') {
                console.log('Updating ring warmth...');
                this.updateRingWarmth();
            }
        }
        
        // Only apply system control if power is ON and not initializing
        if (this.powerState && !this.isInitializing) {
            this.debounceSystemControl(sliderId, value);
        }
        
        // Emit custom event for external listeners
        this.emitSliderChange(sliderId, value);
    }

    debounceSystemControl(sliderId, value) {
        // Clear existing timer for this slider
        if (this.debounceTimers[sliderId]) {
            clearTimeout(this.debounceTimers[sliderId]);
        }
        
        // Set new timer
        this.debounceTimers[sliderId] = setTimeout(() => {
            // Only apply if power is still ON and not initializing
            if (this.powerState && !this.isInitializing) {
                this.applySystemControl(sliderId, value);
            }
            // Clear the timer reference
            delete this.debounceTimers[sliderId];
        }, this.debounceDelay);
    }

    applySystemControl(sliderId, value) {
        if (!this.isElectron) return;
        
        const slider = this.sliders[sliderId];
        const controlType = slider.systemControl;
        
        // Prevent duplicate calls with the same value
        if (slider.lastAppliedValue === value) {
            return;
        }
        
        // Store the last applied value
        slider.lastAppliedValue = value;
        
        switch (controlType) {
            case 'brightness':
                this.setSystemBrightness(value);
                break;
            case 'thickness':
                this.updateRingThickness();
                break;
            case 'ringSize':
                this.setSystemRingSize(value);
                break;
            case 'colorTemp':
                this.setColorTemperature(value);
                break;
        }
    }

    setSystemBrightness(value) {
        // Convert percentage to brightness level (0-100)
        const brightness = Math.round(value);
        console.log(`Setting system brightness to ${brightness}%`);
        
        // In a real Electron app, you would use native APIs here
        // For now, we'll simulate the control
        if (window.electronAPI && window.electronAPI.setBrightness) {
            window.electronAPI.setBrightness(brightness);
        } else {
            // Fallback for web version
            document.body.style.filter = `brightness(${brightness / 50})`;
        }
    }

    setSystemRingSize(value) {
        // Convert percentage to ring size (0-100)
        const ringSize = Math.round(value);
        console.log(`Setting system ring size to ${ringSize}%`);
        
        if (window.electronAPI && window.electronAPI.setRingSize) {
            window.electronAPI.setRingSize(ringSize);
        }
    }

    setColorTemperature(value) {
        // Convert percentage to color temperature (warm to cool)
        const temp = Math.round(value);
        console.log(`Setting color temperature to ${temp}%`);
        
        if (window.electronAPI && window.electronAPI.setColorTemp) {
            window.electronAPI.setColorTemp(temp);
        }
    }

    getValueHue(sliderId, value) {
        // Different color schemes for different sliders
        switch(sliderId) {
            case 'brightness':
                return 60 + (value * 0.6); // Yellow to green
            case 'thickness':
                return 0 + (value * 1.2); // Red to orange
            case 'warmth':
                return 200 + (value * 1.6); // Blue to purple
            default:
                return 120 + (value * 1.2); // Green to cyan
        }
    }

    emitSliderChange(sliderId, value) {
        const event = new CustomEvent('sliderChange', {
            detail: { sliderId, value }
        });
        document.dispatchEvent(event);
        
        // Log the change
        console.log(`${sliderId} changed to ${value}%`);
    }

    
    togglePower() {
        // Prevent rapid toggling
        if (this.isPowerToggling) {
            console.log('Power toggle in progress, ignoring request');
            return;
        }
        
        this.isPowerToggling = true;
        
        this.powerState = !this.powerState;
        const powerBtn = document.getElementById('power-btn');
        const powerStatus = document.querySelector('.power-status');
        
        console.log('Power toggled to:', this.powerState ? 'ON' : 'OFF');
        
        if (this.powerState) {
            powerBtn.classList.add('active');
            powerStatus.textContent = 'ON';
            powerStatus.style.color = '#00ff00';
            this.enableSliders();
            this.showRing();
        } else {
            powerBtn.classList.remove('active');
            powerStatus.textContent = 'OFF';
            powerStatus.style.color = '#ffffff';
            this.disableSliders();
            this.hideRing();
        }
        
        // Allow power toggling again after a short delay
        setTimeout(() => {
            this.isPowerToggling = false;
        }, 1000);
    }

    showRing() {
        console.log('showRing called');
        if (this.isElectron && window.electronAPI) {
            // Use Electron overlay window for full-screen ring
            console.log('Attempting to create Electron overlay window...');
            const ringData = {
                monitor: this.selectedMonitor,
                thickness: this.sliders['thickness'] ? this.sliders['thickness'].currentValue : 50,
                brightness: this.sliders['brightness'] ? this.sliders['brightness'].currentValue : 100,
                size: this.sliders['size'] ? this.sliders['size'].currentValue : 25,
                warmth: this.sliders['warmth'] ? this.sliders['warmth'].currentValue : 50,
                color: this.getColorTemperature(this.sliders['warmth'] ? this.sliders['warmth'].currentValue : 50)
            };
            
            console.log(`Creating ring overlay for monitor: ${this.selectedMonitor}`);
            
            window.electronAPI.showRingOverlay(ringData).then(result => {
                if (result.success) {
                    console.log(`Ring overlay window(s) created successfully for ${result.displays} display(s)`);
                    // Update ring properties based on current slider values
                    setTimeout(() => {
                        this.updateRingThickness();
                        this.updateRingBrightness();
                        this.updateRingSize();
                        this.updateRingWarmth();
                    }, 500); // Small delay to ensure overlay is ready
                } else {
                    console.error('Failed to create ring overlay:', result.error);
                    // Fallback to DOM-based ring
                    this.showDomRing();
                }
            }).catch(error => {
                console.error('Error creating ring overlay:', error);
                // Fallback to DOM-based ring
                this.showDomRing();
            });
        } else {
            // Fallback to DOM-based ring for web version
            this.showDomRing();
        }
    }

    showDomRing() {
        console.log('Using DOM-based ring (web fallback)');
        if (this.ringOverlay) {
            this.ringOverlay.classList.add('visible');
            console.log('Ring overlay made visible');
            this.updateRingThickness();
            this.updateRingBrightness();
            this.updateRingSize();
            this.updateRingWarmth();
        } else {
            console.error('Ring overlay is null in showRing!');
        }
    }

    hideRing() {
        if (this.isElectron && window.electronAPI) {
            // Use Electron overlay window
            window.electronAPI.hideRingOverlay().then(result => {
                if (result.success) {
                    console.log('Ring overlay window hidden successfully');
                } else {
                    console.error('Failed to hide ring overlay:', result.error);
                }
            }).catch(error => {
                console.error('Error hiding ring overlay:', error);
            });
        } else {
            // Fallback to DOM-based ring for web version
            if (this.ringOverlay) {
                this.ringOverlay.classList.remove('visible');
            }
        }
    }

    updateRingThickness() {
        if (this.powerState) {
            const thicknessValue = this.sliders['thickness'] ? this.sliders['thickness'].currentValue : 100;
            console.log(`updateRingThickness called with value: ${thicknessValue}%`);
            
            if (this.isElectron && window.electronAPI) {
                // Update Electron overlay window
                window.electronAPI.updateRingProperties({ thickness: thicknessValue }).then(result => {
                    if (result.success) {
                        console.log('Ring thickness updated in overlay window');
                    } else {
                        console.error('Failed to update ring thickness:', result.error);
                    }
                }).catch(error => {
                    console.error('Error updating ring thickness:', error);
                });
            } else {
                // Fallback to DOM-based ring for web version
                if (this.ring) {
                    const borderWidth = Math.max(2, Math.min(300, (thicknessValue / 100) * 300));
                    this.ring.style.borderWidth = `${borderWidth}px`;
                    console.log(`DOM ring border width set to: ${borderWidth}px`);
                }
            }
        }
    }

    updateRingBrightness() {
        if (this.powerState) {
            const brightnessValue = this.sliders['brightness'] ? this.sliders['brightness'].currentValue : 100;
            
            if (this.isElectron && window.electronAPI) {
                // Update Electron overlay window
                window.electronAPI.updateRingProperties({ brightness: brightnessValue }).then(result => {
                    if (result.success) {
                        console.log('Ring brightness updated in overlay window');
                    } else {
                        console.error('Failed to update ring brightness:', result.error);
                    }
                }).catch(error => {
                    console.error('Error updating ring brightness:', error);
                });
            } else {
                // Fallback to DOM-based ring for web version
                if (this.ring) {
                    const opacity = Math.max(0.1, Math.min(1, brightnessValue / 100));
                    this.ring.style.opacity = opacity;
                }
            }
        }
    }

    updateRingSize() {
        if (this.powerState) {
            const sizeValue = this.sliders['size'] ? this.sliders['size'].currentValue : 100;
            
            if (this.isElectron && window.electronAPI) {
                // Update Electron overlay window
                window.electronAPI.updateRingProperties({ size: sizeValue }).then(result => {
                    if (result.success) {
                        console.log('Ring size updated in overlay window');
                    } else {
                        console.error('Failed to update ring size:', result.error);
                    }
                }).catch(error => {
                    console.error('Error updating ring size:', error);
                });
            } else {
                // Fallback to DOM-based ring for web version
                if (this.ring) {
                    const size = Math.max(100, Math.min(1200, (sizeValue / 100) * 1200));
                    this.ring.style.width = `${size}px`;
                    this.ring.style.height = `${size}px`;
                }
            }
        }
    }

    updateRingWarmth() {
        if (this.powerState) {
            const warmthValue = this.sliders['warmth'] ? this.sliders['warmth'].currentValue : 50;
            
            // Convert warmth value (0-100) to color temperature
            // 0 = cool (blue), 50 = neutral (white), 100 = warm (orange/red)
            const colorTemp = this.getColorTemperature(warmthValue);
            
            if (this.isElectron && window.electronAPI) {
                // Update Electron overlay window
                window.electronAPI.updateRingProperties({ warmth: warmthValue, color: colorTemp }).then(result => {
                    if (result.success) {
                        console.log('Ring warmth updated in overlay window');
                    } else {
                        console.error('Failed to update ring warmth:', result.error);
                    }
                }).catch(error => {
                    console.error('Error updating ring warmth:', error);
                });
            } else {
                // Fallback to DOM-based ring for web version
                if (this.ring) {
                    this.ring.style.borderColor = colorTemp;
                    console.log(`DOM ring color updated to: ${colorTemp}`);
                }
            }
        }
    }

    getColorTemperature(warmthValue) {
        // Convert warmth percentage to RGB color
        // 0% = cool blue, 50% = neutral white, 100% = warm orange/red
        let r, g, b;
        
        if (warmthValue <= 50) {
            // Cool to neutral (blue to white)
            const factor = warmthValue / 50;
            r = Math.round(255 * factor);
            g = Math.round(255 * factor);
            b = 255;
        } else {
            // Neutral to warm (white to orange/red)
            const factor = (warmthValue - 50) / 50;
            r = 255;
            g = Math.round(255 * (1 - factor * 0.6)); // Reduce green for warmer colors
            b = Math.round(255 * (1 - factor * 0.8)); // Reduce blue for warmer colors
        }
        
        return `rgba(${r}, ${g}, ${b}, 0.9)`;
    }

    getTemperatureLabel(warmthValue) {
        if (warmthValue <= 0) {
            return 'Coolest';
        } else if (warmthValue <= 45) {
            return 'Cool';
        } else if (warmthValue = 50) {
            return 'Neutral';
        } else if (warmthValue <= 75) {
            return 'Warm';
        } else if (warmthValue < 100) {
            return 'Hot';
        } else {
            return 'Warmest';
        }
    }

    enableSliders() {
        Object.keys(this.sliders).forEach(sliderId => {
            const slider = this.sliders[sliderId];
            slider.thumb.style.pointerEvents = 'auto';
            slider.thumb.style.opacity = '1';
            if (slider.fill) {
                slider.fill.style.opacity = '1';
            }
        });
    }

    disableSliders() {
        Object.keys(this.sliders).forEach(sliderId => {
            const slider = this.sliders[sliderId];
            slider.thumb.style.pointerEvents = 'none';
            slider.thumb.style.opacity = '0.5';
            if (slider.fill) {
                slider.fill.style.opacity = '0.5';
            }
        });
    }

    emitPowerChange() {
        const event = new CustomEvent('powerChange', {
            detail: { powerState: this.powerState }
        });
        document.dispatchEvent(event);
        
        console.log(`Power ${this.powerState ? 'ON' : 'OFF'}`);
    }

    minimizeWindow() {
        console.log('Minimize window');
        if (this.isElectron) {
            window.electronAPI.minimizeWindow();
        } else {
            // Web fallback
            document.body.style.transform = 'scale(0.8)';
            setTimeout(() => {
                document.body.style.transform = 'scale(1)';
            }, 200);
        }
    }

    closeWindow() {
        console.log('Close window');
        if (this.isElectron) {
            window.electronAPI.closeWindow();
        } else {
            // Web fallback
            document.body.style.opacity = '0';
            setTimeout(() => {
                document.body.style.opacity = '1';
            }, 200);
        }
    }

    openSettings() {
        console.log('Open settings');
        if (this.isElectron) {
            // In Electron, we could open a settings window
            alert('Uh you looking for something?');
        } else {
            alert('Settings panel would open here');
        }
    }


    // Public methods for external control
    setSliderValue(sliderId, value) {
        if (this.sliders[sliderId]) {
            this.updateSlider(sliderId, value);
        }
    }

    getSliderValue(sliderId) {
        return this.sliders[sliderId] ? this.sliders[sliderId].currentValue : 0;
    }

    setPowerState(state) {
        if (state !== this.powerState) {
            this.togglePower();
        }
    }

    getPowerState() {
        return this.powerState;
    }

    // Get all current values
    getAllValues() {
        const values = {};
        Object.keys(this.sliders).forEach(sliderId => {
            values[sliderId] = this.sliders[sliderId].currentValue;
        });
        values.power = this.powerState;
        return values;
    }
}

// PayPal Support Function
function openPayPal() {
    console.log('Opening PayPal support link');
    const paypalUrl = 'https://paypal.me/SaadBinoi';
    
    if (window.electronAPI) {
        // In Electron app, use shell to open external URL
        window.electronAPI.openExternal(paypalUrl);
    } else {
        // In web browser, open in new tab
        window.open(paypalUrl, '_blank');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ringApp = new RingControlApp();
    
    // Example: Listen for slider changes
    document.addEventListener('sliderChange', (event) => {
        const { sliderId, value } = event.detail;
        console.log(`Slider ${sliderId} changed to ${value}%`);
    });
    
    // Example: Listen for power changes
    document.addEventListener('powerChange', (event) => {
        const { powerState } = event.detail;
        console.log(`Power is now ${powerState ? 'ON' : 'OFF'}`);
    });
}); 