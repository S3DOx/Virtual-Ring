# Ring Control Panel App

A modern, responsive desktop application with interactive sliders for controlling thickness, color warmth, and brightness. Built with Electron and currently optimized for Windows systems.

![Ring Control Panel](https://img.shields.io/badge/Platform-Windows-blue)
![Electron](https://img.shields.io/badge/Built%20with-Electron-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Features

- **Desktop App**: Runs as a native desktop application using Electron
- **Dark Theme**: Authentic dark design with green accents
- **Three Interactive Sliders**:
  - **Brightness Slider**: Control display brightness
  - **Thickness Slider**: Adjust ring thickness
  - **Ring Size Slider**: Modify ring size
  - **Color Warmth Slider**: Control color temperature
- **Power Control**: Toggle ring overlay on/off
- **Multi-Monitor Support**: Control primary display or all displays
- **Responsive Design**: Works on different screen sizes
- **Windows Support**: Currently optimized for Windows systems

## 📸 Screenshots

*Screenshots will be added here*

## 🛠️ Installation

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/S3DOx/ring-control-app.git
   cd ring-control-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the application**:
   ```bash
   npm start
   ```

### Development

For development with hot reload:
```bash
npm run dev
```

### Building

To build the application for distribution:
```bash
npm run build
```

## 📖 Usage

### Basic Controls

1. **Power Button**: Click the center power button to toggle the ring overlay
2. **Brightness Slider**: Drag the left vertical slider to adjust brightness
3. **Thickness Slider**: Drag the right vertical slider to adjust ring thickness
4. **Ring Size Slider**: Drag the horizontal slider to adjust ring size
5. **Color Warmth Slider**: Drag the bottom slider to adjust color temperature

### Monitor Selection

Use the monitor dropdown to select:
- **Primary Display**: Control only the main monitor
- **All Displays**: Control all connected monitors

## 🔧 API Reference

The app exposes a global `ringApp` object with the following methods:

### Getting Values

```javascript
// Get individual slider values
const brightness = ringApp.getSliderValue('brightness');
const thickness = ringApp.getSliderValue('thickness');
const size = ringApp.getSliderValue('size');
const warmth = ringApp.getSliderValue('warmth');

// Get power state
const powerState = ringApp.getPowerState();

// Get all values at once
const allValues = ringApp.getAllValues();
```

### Setting Values

```javascript
// Set individual slider values (0-100)
ringApp.setSliderValue('brightness', 75);
ringApp.setSliderValue('thickness', 25);
ringApp.setSliderValue('size', 50);
ringApp.setSliderValue('warmth', 90);

// Set power state
ringApp.setPowerState(true);  // Turn on
ringApp.setPowerState(false); // Turn off
```

### Event Listeners

```javascript
// Listen for slider changes
document.addEventListener('sliderChange', (event) => {
    const { sliderId, value } = event.detail;
    console.log(`Slider ${sliderId} changed to ${value}%`);
});

// Listen for power changes
document.addEventListener('powerChange', (event) => {
    const { powerState } = event.detail;
    console.log(`Power is now ${powerState ? 'ON' : 'OFF'}`);
});
```

## 🏗️ Project Structure

```
ring-control-app/
├── main.js              # Electron main process
├── preload.js           # Preload script for security
├── index.html           # Main application window
├── script.js            # Application logic
├── styles.css           # Styling and themes
├── overlay.html         # Ring overlay window
├── package.json         # Dependencies and scripts
├── README.md           # This file
└── assets/             # Images and resources
```

## 🎨 Customization

### Themes

The app uses CSS custom properties for easy theming:

```css
:root {
    --control-green: #00ff00;
    --background-dark: #1a1a1a;
    --panel-dark: #2a2a2a;
    --text-light: #ffffff;
}
```

### Adding New Sliders

1. Add HTML structure in `index.html`
2. Add CSS styles in `styles.css`
3. Add JavaScript logic in `script.js`
4. Update the slider configuration

## 🐛 Troubleshooting

### Common Issues

**App won't start:**
- Ensure Node.js version 14+ is installed
- Run `npm install` to install dependencies
- Check console for error messages

**Sliders not responding:**
- Ensure the app has proper permissions
- Check if any antivirus is blocking the app
- Restart the application

**Ring overlay not showing:**
- Click the power button to enable
- Check monitor selection
- Ensure no other applications are blocking overlay

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a Pull Request

### Code Style

- Use consistent indentation (2 spaces)
- Follow JavaScript ES6+ standards
- Add comments for complex logic
- Test your changes before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://electronjs.org/)
- Inspired by modern control panel designs

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/S3DOx/ring-control-app/issues) page
2. Create a new issue with detailed information
3. Include your operating system and Node.js version

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Basic slider controls
- Ring overlay functionality
- Multi-monitor support

---

**Made with ❤️ by [S3DOx]**

*If this project helps you, consider supporting it with a donation via the PayPal button in the app!* 
