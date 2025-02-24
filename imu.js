class IMU {
    constructor() {
        this.accel = { x: 0, y: 0, z: 0 }
        this.rotation = { x: 0, y: 0, z: 0 }
        this.orientation = { alpha: 0, beta: 0, gamma: 0 }
        this.screenOrientation = window.screen.orientation?.type || 'unknown'

        this.motionListener = null
        this.orientationListener = null
        this.screenOrientationListener = null
        this.initialized = false
        
        this.ACCEL_MAX = 9.81 * 16
        this.ROTATION_MAX = 2000
    }

    init() {
        return new Promise(async (resolve, reject) => {
            if (!window.DeviceMotionEvent || !window.DeviceOrientationEvent) {
                reject("Device sensors not supported on this device")
                return
            }

            try {
                // Request motion permission
                if (typeof DeviceMotionEvent.requestPermission === 'function') {
                    const motionPermission = await DeviceMotionEvent.requestPermission()
                    if (motionPermission !== 'granted') {
                        reject('Permission to access motion sensors was denied')
                        return
                    }
                }

                // Request orientation permission
                if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                    const orientationPermission = await DeviceOrientationEvent.requestPermission()
                    if (orientationPermission !== 'granted') {
                        reject('Permission to access orientation sensors was denied')
                        return
                    }
                }

                this.initialized = true
                resolve("IMU initialized")
            } catch (err) {
                reject(typeof err === 'string' ? err : err.message)
            }
        })
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max)
    }

    normalizeAccel(value) {
        return this.clamp(Number(value) || 0, -this.ACCEL_MAX, this.ACCEL_MAX)
    }

    normalizeRotation(value, axis) {
        value = Number(value) || 0
        switch(axis) {
            case 'alpha':
                return ((value % 360) + 360) % 360
            case 'beta':
                return this.clamp(value, -180, 180)
            case 'gamma':
                return this.clamp(value, -90, 90)
            default:
                return this.clamp(value, -this.ROTATION_MAX, this.ROTATION_MAX)
        }
    }

    isLandscape() {
        // Check if screen orientation API is available
        if (window.screen.orientation) {
            return window.screen.orientation.type.includes('landscape')
        }
        // Fallback to window dimensions
        return window.innerWidth > window.innerHeight
    }

    getOrientationInfo() {
        const isLandscape = this.isLandscape()
        return {
            type: this.screenOrientation,
            isLandscape: isLandscape,
            isPortrait: !isLandscape,
            angle: window.screen.orientation?.angle || 0
        }
    }

    // ... (previous methods remain the same) ...

    listen(cb) {
        if (!this.initialized) {
            throw new Error('IMU must be initialized before listening')
        }

        // Handle screen orientation changes
        this.screenOrientationListener = () => {
            this.screenOrientation = window.screen.orientation?.type || 'unknown'
            this.updateCallback(cb)
        }

        // Handle motion events
        this.motionListener = (event) => {
            const accel = event.accelerationIncludingGravity
            if (accel) {
                // If in landscape, swap X and Y accelerometer readings
                if (this.isLandscape()) {
                    this.accel = {
                        x: this.normalizeAccel(accel.y),
                        y: this.normalizeAccel(-accel.x), // Negate for correct direction
                        z: this.normalizeAccel(accel.z)
                    }
                } else {
                    this.accel = {
                        x: this.normalizeAccel(accel.x),
                        y: this.normalizeAccel(accel.y),
                        z: this.normalizeAccel(accel.z)
                    }
                }
            }

            const rotation = event.rotationRate
            if (rotation) {
                // Adjust rotation based on orientation
                if (this.isLandscape()) {
                    this.rotation = {
                        x: this.normalizeRotation(rotation.beta, 'beta'),
                        y: this.normalizeRotation(-rotation.alpha, 'alpha'),
                        z: this.normalizeRotation(rotation.gamma, 'gamma')
                    }
                } else {
                    this.rotation = {
                        x: this.normalizeRotation(rotation.alpha, 'alpha'),
                        y: this.normalizeRotation(rotation.beta, 'beta'),
                        z: this.normalizeRotation(rotation.gamma, 'gamma')
                    }
                }
            }

            this.updateCallback(cb)
        }

        // Handle orientation events
        this.orientationListener = (event) => {
            if (this.isLandscape()) {
                this.orientation = {
                    alpha: this.normalizeRotation(event.beta, 'beta'),
                    beta: this.normalizeRotation(-event.alpha, 'alpha'),
                    gamma: this.normalizeRotation(event.gamma, 'gamma')
                }
            } else {
                this.orientation = {
                    alpha: this.normalizeRotation(event.alpha, 'alpha'),
                    beta: this.normalizeRotation(event.beta, 'beta'),
                    gamma: this.normalizeRotation(event.gamma, 'gamma')
                }
            }

            this.updateCallback(cb)
        }

        window.addEventListener('devicemotion', this.motionListener)
        window.addEventListener('deviceorientation', this.orientationListener)
        window.addEventListener('orientationchange', this.screenOrientationListener)
    }

    updateCallback(cb) {
        // Calculate magnitudes using the numeric values
        const accelMagnitude = Math.sqrt(
            this.accel.x ** 2 + 
            this.accel.y ** 2 + 
            this.accel.z ** 2
        )

        const rotationMagnitude = Math.sqrt(
            this.rotation.x ** 2 + 
            this.rotation.y ** 2 + 
            this.rotation.z ** 2
        )

        // Format values for display
        const displayData = {
            accel: {
                x: this.accel.x.toFixed(2),
                y: this.accel.y.toFixed(2),
                z: this.accel.z.toFixed(2)
            },
            rotation: {
                x: this.rotation.x.toFixed(2),
                y: this.rotation.y.toFixed(2),
                z: this.rotation.z.toFixed(2)
            },
            orientation: {
                alpha: this.orientation.alpha.toFixed(2),
                beta: this.orientation.beta.toFixed(2),
                gamma: this.orientation.gamma.toFixed(2)
            },
            screenOrientation: this.getOrientationInfo(),
            magnitudes: {
                accelMagnitude: accelMagnitude.toFixed(2),
                rotationMagnitude: rotationMagnitude.toFixed(2)
            }
        }

        cb(displayData)
    }

    removeListener() {
        if (this.motionListener) {
            window.removeEventListener('devicemotion', this.motionListener)
            this.motionListener = null
        }
        if (this.orientationListener) {
            window.removeEventListener('deviceorientation', this.orientationListener)
            this.orientationListener = null
        }
        if (this.screenOrientationListener) {
            window.removeEventListener('orientationchange', this.screenOrientationListener)
            this.screenOrientationListener = null
        }
    }
}

