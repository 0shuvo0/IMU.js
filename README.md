# IMU.js

A lightweight JavaScript library for accessing and normalizing device motion and orientation sensors. IMU.js provides a simple interface to work with accelerometer, gyroscope, and device orientation data, with automatic handling of device orientation changes and sensor permissions.

## Features

- 📱 Access device accelerometer and gyroscope data
- 🧭 Track device orientation changes
- 📐 Automatic sensor data normalization
- 🔄 Landscape/Portrait orientation detection and compensation
- 📊 Real-time motion magnitude calculations
- 🔒 Handles iOS sensor permissions
- ⚡ Lightweight with zero dependencies

## Installation

### **CDN / Direct Download**

Download the latest version: [imu.umd.js](https://raw.githubusercontent.com/0shuvo0/IMU.js/refs/heads/main/imu.umd.js)

Include it in your HTML file:

```html
<script src="imu.umd.js"></script>
```

### **NPM (Node.js / Webpack / Vite / Parcel)**

Install via npm:

```sh
npm install imujs
```

Import in your JavaScript file:

```javascript
import IMU from "imujs";
```

## Quick Start

```javascript
const imu = new IMU()

// Initialize on user interaction (required for iOS)
button.addEventListener('click', async () => {
    try {
        await imu.init()
        console.log("IMU initialized!")
        
        imu.listen(data => {
            console.log(data)
        })
    } catch (err) {
        console.error("IMU initialization failed:", err)
    }
})
```

## API Reference

### Constructor

```javascript
const imu = new IMU()
```

### Methods

#### `init()`
Initializes the IMU and requests necessary permissions. Returns a Promise.

```javascript
await imu.init()
```

#### `listen(callback)`
Starts listening to sensor events. The callback receives sensor data.

```javascript
imu.listen(data => {
    const { accel, rotation, orientation, screenOrientation, magnitudes } = data
})
```

#### `removeListeners()`
Stops listening to sensor events and cleans up event listeners.

```javascript
imu.removeListeners()
```

### Data Format

The callback receives an object with the following structure:

```javascript
{
    accel: {
        x: "0.00",  // m/s², range: ±157 (±16g)
        y: "0.00",
        z: "0.00"
    },
    rotation: {
        x: "0.00",  // degrees/second, range: ±2000
        y: "0.00",
        z: "0.00"
    },
    orientation: {
        alpha: "0.00",  // compass direction (0-360)
        beta: "0.00",   // front/back tilt (-180 to 180)
        gamma: "0.00"   // left/right tilt (-90 to 90)
    },
    screenOrientation: {
        type: "portrait-primary",
        isLandscape: false,
        isPortrait: true,
        angle: 0
    },
    magnitudes: {
        accelMagnitude: "9.81",     // total acceleration magnitude
        rotationMagnitude: "0.00"   // total rotation magnitude
    }
}
```

## Example Usage

### Basic Motion Tracking

```javascript
const imu = new IMU()

async function startTracking() {
    try {
        await imu.init()
        
        imu.listen(data => {
            const { x, y, z } = data.accel
            console.log(`Acceleration: X=${x}, Y=${y}, Z=${z}`)
        })
    } catch (err) {
        console.error("Failed to start tracking:", err)
    }
}
```

### Orientation-Aware Game Input

```javascript
const imu = new IMU()

async function setupGameControls() {
    try {
        await imu.init()
        
        imu.listen(data => {
            const { beta, gamma } = data.orientation
            const tiltForward = beta > 20
            const tiltSide = Math.abs(gamma) > 15
            
            if (tiltForward) movePlayerForward()
            if (tiltSide) movePlayerSideways(gamma)
        })
    } catch (err) {
        console.error("Failed to setup controls:", err)
    }
}
```

### Motion Gesture Detection

```javascript
const imu = new IMU()

async function detectShake() {
    try {
        await imu.init()
        
        let lastMagnitude = 0
        const SHAKE_THRESHOLD = 20
        
        imu.listen(data => {
            const { accelMagnitude } = data.magnitudes
            
            if (Math.abs(accelMagnitude - lastMagnitude) > SHAKE_THRESHOLD) {
                console.log("Shake detected!")
            }
            
            lastMagnitude = accelMagnitude
        })
    } catch (err) {
        console.error("Failed to setup shake detection:", err)
    }
}
```

## Browser Support

- ✅ Chrome for Android
- ✅ Safari iOS (requires user interaction for permission)
- ✅ Chrome Desktop (limited sensor support)
- ✅ Firefox for Android
- ❌ Safari Desktop (no sensor support)

## Notes

1. iOS requires a user interaction (like a button click) before requesting sensor permissions.
2. The device must support the required sensors.
3. Some browsers require HTTPS for accessing sensor data.
4. Screen orientation changes are automatically handled.

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

