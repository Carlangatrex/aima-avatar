class PixelRobot {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Settings
        this.pixelSize = 6; // Higher resolution: smaller pixels for more detail
        this.width = this.canvas.width / this.pixelSize; // Approx 66 "pixels" width
        this.height = this.canvas.height / this.pixelSize; // Approx 66 "pixels" height
        
        // Colors
        this.colors = {
            bg: '#1e293b', // Match CSS background
            face: '#d946ef', // Magenta / Fuchsia
            eyeBg: '#0f172a',
            eyeGlow: '#f472b6', // Light pink for eyes/mouth
            mouth: '#0f172a'
        };
        
        this.state = 'idle'; // idle, listening, talking
        this.mouthOpen = 0; // 0 to 3
        this.lastMouthPulse = 0; // timestamp of last word pulse
        this.blink = false;
        
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
            this.mouthHold = 0;
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
        
        // --- Alta Resolución: Carcasa del Monitor ---
        // Centro principal
        this.drawRect(cx - 16, cy - 12, 33, 25, this.colors.face);
        // Extremos Arriba/Abajo
        this.drawRect(cx - 14, cy - 16, 29, 33, this.colors.face);
        // Relleno de esquinas redondeadas
        this.drawRect(cx - 15, cy - 14, 31, 29, this.colors.face);
        
        // --- Alta Resolución: Pantalla Interior ---
        this.drawRect(cx - 14, cy - 10, 29, 21, this.colors.eyeBg);
        this.drawRect(cx - 12, cy - 12, 25, 25, this.colors.eyeBg);
        this.drawRect(cx - 13, cy - 11, 27, 23, this.colors.eyeBg);
        
        // --- Reflejo sutil de cristal en la pantalla ---
        this.drawRect(cx - 11, cy - 10, 20, 2, 'rgba(255,255,255,0.03)');
        this.drawRect(cx - 12, cy - 8, 8, 2, 'rgba(255,255,255,0.03)');
        
        // Draw Eyes
        const eyeColor = this.state === 'listening' ? '#ef4444' : (this.state === 'thinking' ? '#f59e0b' : this.colors.eyeGlow);
        
        if (!this.blink) {
            // Ojo Izquierdo (redondeado)
            this.drawRect(cx - 8, cy - 6, 6, 7, eyeColor);
            this.drawRect(cx - 9, cy - 5, 8, 5, eyeColor); 
            // Ojo Derecho (redondeado)
            this.drawRect(cx + 3, cy - 6, 6, 7, eyeColor);
            this.drawRect(cx + 2, cy - 5, 8, 5, eyeColor); 
            
            // Brillo en los ojos (pupila/reflejo blanco)
            if (this.state !== 'listening') {
                this.drawRect(cx - 5, cy - 5, 2, 2, '#ffffff');
                this.drawRect(cx + 6, cy - 5, 2, 2, '#ffffff');
            }
        } else {
            // Pestañeo
            this.drawRect(cx - 9, cy - 2, 8, 2, eyeColor);
            this.drawRect(cx + 2, cy - 2, 8, 2, eyeColor);
        }
        
        // Draw Mouth
        let mouthColor = this.state === 'listening' ? '#ef4444' : this.colors.eyeGlow;
        
        if (this.state === 'idle' || this.state === 'listening') {
            // Sonrisa sutil
            this.drawRect(cx - 4, cy + 7, 9, 2, mouthColor);
            this.drawRect(cx - 5, cy + 6, 2, 2, mouthColor); // comisura izq
            this.drawRect(cx + 4, cy + 6, 2, 2, mouthColor); // comisura der
        } else if (this.state === 'talking') {
            // Animaciones de habla fluidas
            if (this.mouthOpen === 0) {
                this.drawRect(cx - 4, cy + 7, 9, 2, mouthColor);
            } else if (this.mouthOpen === 1) {
                this.drawRect(cx - 4, cy + 6, 9, 4, mouthColor);
            } else if (this.mouthOpen === 2) {
                this.drawRect(cx - 5, cy + 5, 11, 6, mouthColor);
            } else {
                this.drawRect(cx - 3, cy + 5, 7, 8, mouthColor);
            }
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
        
        // Talking logic
        if (this.state === 'talking') {
            const sincePulse = performance.now() - this.lastMouthPulse;
            if (sincePulse < 150) {
                // Palabra recién pronunciada: boca bien abierta
                this.mouthOpen = 3;
            } else if (sincePulse < 300) {
                // Cierre gradual 1
                this.mouthOpen = 2;
            } else if (sincePulse < 480) {
                // Cierre gradual 2
                this.mouthOpen = 1;
            } else if (sincePulse > 1300) {
                // Sin eventos de palabra (voz sin límites): jitter suave para no congelar
                this.talkTimer += deltaTime;
                if (this.talkTimer > 220) {
                    this.mouthOpen = Math.floor(Math.random() * 3);
                    this.talkTimer = 0;
                }
            } else {
                // Pausa breve entre palabras: boca cerrada
                this.mouthOpen = 0;
            }
        }
        
        this.render();
        requestAnimationFrame(this.animate);
    }
}

// Export to global scope
window.PixelRobot = PixelRobot;
