class PixelRobot {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Settings
        this.pixelSize = 6; // Higher resolution: smaller pixels for more detail
        this.width = this.canvas.width / this.pixelSize; // Approx 46 "pixels" width (280/6)
        this.height = this.canvas.height / this.pixelSize; // Approx 46 "pixels" height

        // Colors
        this.colors = {
            bg: '#1e293b', // Match CSS background
            face: '#d946ef', // Magenta / Fuchsia
            eyeBg: '#0f172a',
            eyeGlow: '#f472b6', // Light pink for eyes/mouth
            mouth: '#0f172a',
            success: '#10b981', // Green
            error: '#ef4444', // Red
            thinking: '#f59e0b', // Amber
            neutral: '#f8fafc' // White for highlights
        };

        this.state = 'idle'; // idle, listening, talking, thinking, success, error, confused, celebrating
        this.mouthOpen = 0; // 0 to 3
        this.lastMouthPulse = 0; // timestamp of last word pulse
        this.blink = false;

        // Idle animation timers
        this.idleTimer = 0;
        this.idleAction = 0; // 0=none, 1=look left, 2=look right, 3=blink, 4=nod
        this.eyeOffsetX = 0; // for looking around
        this.eyeOffsetY = 0;

        this.lastTime = 0;
        this.blinkTimer = 0;
        this.talkTimer = 0;

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setState(newState) {
        this.state = newState;
        if (newState === 'idle' || newState === 'listening' || newState === 'thinking') {
            this.mouthOpen = 0;
            this.eyeOffsetX = 0;
            this.eyeOffsetY = 0;
        }
    }

    // Abre la boca en cada palabra detectada por el motor de voz
    pulseMouth() {
        if (this.state === 'talking') {
            this.mouthOpen = 3;
            this.lastMouthPulse = performance.now();
        }
    }

    drawPixel(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.pixelSize,
            y * this.pixelSize,
            this.pixelSize,
            this.pixelSize
        );
    }

    drawRect(x, y, w, h, color) {
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                this.drawPixel(x + i, y + j, color);
            }
        }
    }

    render() {
        // Clear background
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const cx = Math.floor(this.width / 2);
        const cy = Math.floor(this.height / 2);
        const ex = cx + this.eyeOffsetX;
        const ey = cy + this.eyeOffsetY;

        // Choose face color based on state
        let faceColor = this.colors.face;
        if (this.state === 'success') faceColor = this.colors.success;
        else if (this.state === 'error') faceColor = this.colors.error;
        else if (this.state === 'thinking') faceColor = this.colors.thinking;

        // --- Monitor casing ---
        this.drawRect(cx - 16, cy - 12, 33, 25, faceColor);
        this.drawRect(cx - 14, cy - 16, 29, 33, faceColor);
        this.drawRect(cx - 15, cy - 14, 31, 29, faceColor);

        // --- Screen interior ---
        this.drawRect(cx - 14, cy - 10, 29, 21, this.colors.eyeBg);
        this.drawRect(cx - 12, cy - 12, 25, 25, this.colors.eyeBg);
        this.drawRect(cx - 13, cy - 11, 27, 23, this.colors.eyeBg);

        // --- Subtle glass reflection ---
        this.drawRect(cx - 11, cy - 10, 20, 2, 'rgba(255,255,255,0.03)');
        this.drawRect(cx - 12, cy - 8, 8, 2, 'rgba(255,255,255,0.03)');

        // --- Determine eye color ---
        let eyeColor = this.colors.eyeGlow;
        if (this.state === 'listening') eyeColor = '#ef4444';
        else if (this.state === 'thinking') eyeColor = '#f59e0b';
        else if (this.state === 'success') eyeColor = '#10b981';
        else if (this.state === 'error') eyeColor = '#ef4444';

        // --- Eyes ---
        if (!this.blink) {
            // Left eye
            this.drawRect(ex - 8, ey - 6, 6, 7, eyeColor);
            this.drawRect(ex - 9, ey - 5, 8, 5, eyeColor);
            // Right eye
            this.drawRect(ex + 3, ey - 6, 6, 7, eyeColor);
            this.drawRect(ex + 2, ey - 5, 8, 5, eyeColor);

            // Pupils / reflections
            if (this.state !== 'listening') {
                this.drawRect(ex - 5 + Math.max(-1, Math.min(1, this.eyeOffsetX)), ey - 5, 2, 2, '#ffffff');
                this.drawRect(ex + 6 + Math.max(-1, Math.min(1, this.eyeOffsetX)), ey - 5, 2, 2, '#ffffff');
            }
        } else {
            // Blinking
            this.drawRect(ex - 9, ey - 2, 8, 2, eyeColor);
            this.drawRect(ex + 2, ey - 2, 8, 2, eyeColor);
        }

        // --- Mouth ---
        let mouthColor = this.state === 'listening' || this.state === 'error' ? '#ef4444' : this.colors.eyeGlow;
        if (this.state === 'success') mouthColor = '#10b981';
        if (this.state === 'celebrating') mouthColor = '#10b981';

        if (this.state === 'idle' || this.state === 'listening') {
            // Subtle smile
            this.drawRect(cx - 4, cy + 7, 9, 2, mouthColor);
            this.drawRect(cx - 5, cy + 6, 2, 2, mouthColor); // left corner
            this.drawRect(cx + 4, cy + 6, 2, 2, mouthColor); // right corner
        } else if (this.state === 'talking') {
            // Fluid talking animations
            const sincePulse = performance.now() - this.lastMouthPulse;
            if (sincePulse < 150) {
                this.drawRect(cx - 4, cy + 6, 9, 4, mouthColor);
            } else if (sincePulse < 300) {
                this.drawRect(cx - 4, cy + 7, 9, 2, mouthColor);
            } else if (sincePulse < 480) {
                this.drawRect(cx - 3, cy + 7, 7, 2, mouthColor);
            } else {
                this.drawRect(cx - 4, cy + 7, 9, 2, mouthColor);
            }
        } else if (this.state === 'success') {
            // Big happy smile
            this.drawRect(cx - 5, cy + 5, 11, 4, mouthColor);
            this.drawRect(cx - 6, cy + 4, 2, 2, mouthColor);
            this.drawRect(cx + 4, cy + 4, 2, 2, mouthColor);
        } else if (this.state === 'error') {
            // Worried frown
            this.drawRect(cx - 4, cy + 9, 9, 2, mouthColor);
            this.drawRect(cx - 5, cy + 10, 2, 2, mouthColor);
            this.drawRect(cx + 4, cy + 10, 2, 2, mouthColor);
        } else if (this.state === 'confused') {
            // Wavy unsure mouth
            this.drawRect(cx - 4, cy + 8, 9, 2, mouthColor);
            this.drawRect(cx - 2, cy + 7, 2, 2, mouthColor);
            this.drawRect(cx + 0, cy + 7, 2, 2, mouthColor);
            this.drawRect(cx + 2, cy + 7, 2, 2, mouthColor);
        } else if (this.state === 'celebrating') {
            // Big open smile
            this.drawRect(cx - 6, cy + 4, 13, 6, mouthColor);
            this.drawRect(cx - 7, cy + 3, 2, 2, mouthColor);
            this.drawRect(cx + 5, cy + 3, 2, 2, mouthColor);
        } else if (this.state === 'thinking') {
            // Neutral / small hmm
            this.drawRect(cx - 3, cy + 7, 7, 2, mouthColor);
        }
    }

    animate(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Blinking logic
        this.blinkTimer += deltaTime;
        const blinkThreshold = (this.state === 'thinking') ? 1500 + Math.random() * 2000 : 3000 + Math.random() * 4000;
        if (!this.blink && this.blinkTimer > blinkThreshold) {
            this.blink = true;
            this.blinkTimer = 0;
        } else if (this.blink && this.blinkTimer > 150) {
            this.blink = false;
            this.blinkTimer = 0;
        }

        // Talking logic (mouth pulses from words)
        if (this.state === 'talking') {
            const sincePulse = performance.now() - this.lastMouthPulse;
            if (sincePulse < 150) {
                this.mouthOpen = 3;
            } else if (sincePulse < 300) {
                this.mouthOpen = 2;
            } else if (sincePulse < 480) {
                this.mouthOpen = 1;
            } else if (sincePulse > 1300) {
                // No word events: gentle jitter so it doesn't freeze
                this.talkTimer += deltaTime;
                if (this.talkTimer > 220) {
                    this.mouthOpen = Math.floor(Math.random() * 3);
                    this.talkTimer = 0;
                }
            } else {
                this.mouthOpen = 0;
            }
            this.eyeOffsetX = 0;
            this.eyeOffsetY = 0;
        } else if (this.state === 'idle') {
            // Idle animations: look around, blink, nod subtly
            this.idleTimer += deltaTime;
            if (this.idleTimer > 2500) {
                this.idleTimer = 0;
                this.idleAction = Math.floor(Math.random() * 5);
            }
            if (this.idleAction === 1) {
                this.eyeOffsetX = -1;
                this.eyeOffsetY = 0;
            } else if (this.idleAction === 2) {
                this.eyeOffsetX = 1;
                this.eyeOffsetY = 0;
            } else if (this.idleAction === 3) {
                // blink handled above
                this.eyeOffsetX = 0;
                this.eyeOffsetY = 0;
            } else if (this.idleAction === 4) {
                this.eyeOffsetY = -1; // look up briefly
            } else {
                this.eyeOffsetX = 0;
                this.eyeOffsetY = 0;
            }
        } else if (this.state === 'success' || this.state === 'celebrating') {
            // Happy sparkle eyes: alternate brightness
            this.eyeOffsetX = Math.sin(timestamp / 150) > 0 ? 0 : 0;
            this.eyeOffsetY = 0;
        } else if (this.state === 'error' || this.state === 'confused') {
            this.eyeOffsetX = 0;
            this.eyeOffsetY = 0;
        } else if (this.state === 'thinking') {
            // Eyes look up while thinking
            this.eyeOffsetX = 0;
            this.eyeOffsetY = -1;
        } else if (this.state === 'listening') {
            this.eyeOffsetX = 0;
            this.eyeOffsetY = 0;
        }

        this.render();
        requestAnimationFrame(this.animate);
    }
}

// Export to global scope
window.PixelRobot = PixelRobot;
