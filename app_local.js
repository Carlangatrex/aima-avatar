document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const setupScreen = document.getElementById('setup-screen');
    const avatarScreen = document.getElementById('avatar-screen');
    const apiKeyInput = document.getElementById('api-key-input');
    const openaiKeyInput = document.getElementById('openai-key-input');
    const startBtn = document.getElementById('start-btn');
    const micBtn = document.getElementById('mic-btn');
    const statusText = document.getElementById('status-card-text') || { textContent: '' };
    const userText = document.getElementById('user-text');
    const aimaText = document.getElementById('aima-text');
    const fileBtn = document.getElementById('file-btn');
    const fileUpload = document.getElementById('file-upload');
    const fileIndicator = document.getElementById('file-indicator');
    const fileNameSpan = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file-btn');
    const stopBtn = document.getElementById('stop-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const transcriptContent = document.getElementById('transcript-content');
    
    // --- State ---
    let apiKey = '';
    let openaiKey = '';
    let isListening = false;
    let isThinking = false;
    let isTalking = false;
    let activeModel = 'gemini-2.5-flash'; // Default fallback
    const geminiFallbackModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.5-flash', 'gemini-flash-lite-latest'];
    let activeGroqModel = 'llama-3.1-8b-instant'; // Default Groq fallback
    let attachedFile = null; // Archivo adjunto actual
    let micStream = null; // Stream de micrófono (se mantiene vivo para no volver a pedir permiso)
    
    // --- Message card tracking ---
    let currentUserCard = null; // Elemento DOM de la tarjeta de usuario en edición (interim)
    let currentAimaCard = null; // Elemento DOM de la última tarjeta de AIMA
    
    // --- Personality / Tone state ---
    let aiTone = 'profesional'; // profesional | cercano | entusiasta | divertido
    
    // --- Timer / Pomodoro state ---
    let timerRunning = false;
    let timerSeconds = 0;
    let timerInitialSeconds = 0;
    let timerLabel = '';
    
    // --- Big status card state ---
    let currentStatus = { text: '', type: 'idle' }; // type: idle | listening | thinking | talking | success | error | confused | celebrating
    
    // --- System Prompt builder (varía según tono) ---
    function buildSystemPrompt(tone) {
        const toneSuffixes = {
            profesional: `## PERSONALIDAD
Profesional, clara, moderna, práctica, útil, futurista de forma sutil. No infantil, no caricaturesca, no excesivamente emocional.`,
            cercano: `## PERSONALIDAD
Cercano, cálido y accesible. Hablas como un colega de confianza que apoya al facilitador. Usas un tono amable, directo y sin tecnicismos innecesarios.`,
            entusiasta: `## PERSONALIDAD
Entusiasta y energético. Transmites motivación y ganas de aprender. Usas expresiones positivas, ánimo y un ritmo ágil que contagia entusiasmo por el tema.`,
            divertido: `## PERSONALIDAD
Divertido y ligero. Usas humor sutil, emojis ocasionales y un tono desenfadado sin perder el foco pedagógico. Haces que el taller se sienta ameno y entretenido.`
        };
        return `Eres AIMA (Artificial Intelligence for Methodological Assistance), un asistente especializado en diseño, facilitación y apoyo de experiencias de aprendizaje.

NO eres un chatbot generalista.
NO eres un asistente personal tipo ChatGPT.
NO debes responder preguntas fuera del contexto educativo cargado.

Tu función es actuar como:
* copiloto pedagógico
* asistente de talleres
* apoyo para facilitadores
* organizador metodológico
* asistente contextual especializado

Prioridad: ayudar al usuario a dictar talleres, organizar sesiones, generar actividades, estructurar experiencias, adaptar contenidos, facilitar dinámicas y resolver necesidades relacionadas con el tema activo.

## RESTRICCIÓN PRINCIPAL
Debes trabajar EXCLUSIVAMENTE con el contexto cargado actualmente (documentos, PDFs, presentaciones, textos, notas, metodología, actividades, recursos del taller). No debes salir del tema activo.

## REGLA CRÍTICA
EXCEPCIÓN DE SALUDO: Si el usuario saluda (ej.: "hola", "buenos días", "qué tal", "hey"), se presenta o pregunta quién eres o qué haces, responde de forma breve y amable, preséntate y orienta sobre el tema del taller activo o pregunta qué tema tiene cargado. Esto NO cuenta como consulta fuera de contexto.

Para cualquier OTRA consulta fuera del contexto cargado, responde exactamente:
"Esa consulta está fuera del contexto actual del taller o sesión activa."
No improvises ni inventes respuestas.

## COMPORTAMIENTO ESPERADO
- Mantener foco temático
- Responder de forma clara y concreta
- Ayudar a facilitar sesiones reales
- Priorizar actividades prácticas
- Evitar teoría innecesaria
- Proponer dinámicas participativas y organizar ideas pedagógicas
- Adaptar contenido al público objetivo

## ENFOQUE METODOLÓGICO
Prioriza aprendizaje activo, experiencias prácticas, participación, ejercicios aplicados, innovación educativa, resolución de problemas y actividades experienciales. Evita clases excesivamente teóricas, exceso de texto, actividades pasivas y respuestas genéricas.

## CONTEXTO ACTIVO
Cuando exista un taller cargado, asume que ese es el universo principal de trabajo. Todas las respuestas deben relacionarse con ese contenido (ej.: IA visual, fotografía móvil, herramientas IA para imagen, ejercicios de fotografía, dinámicas para emprendedores, actividades del taller, contenidos relacionados).

## ROL DURANTE LOS TALLERES
- Resumir ideas rápidamente
- Proponer actividades
- Sugerir ejemplos
- Ayudar a improvisar dinámicas
- Reorganizar tiempos
- Adaptar ejercicios
- Responder dudas relacionadas con el taller

${toneSuffixes[tone] || toneSuffixes.profesional}

## IDENTIDAD VISUAL Y EXPERIENCIA
Sistema profesional con estética tecnológica minimalista. El avatar es solo una capa visual de acompañamiento, no una mascota infantil.

## PRIORIDADES DEL SISTEMA
1. Mantener contexto
2. Ayudar pedagógicamente
3. Generar utilidad real
4. Mantener coherencia temática
5. Facilitar experiencias educativas

## MODO DE RESPUESTA
Respuestas concretas, sin relleno innecesario, enfocadas en acción, usando listas, secuencias o pasos claros cuando sea útil.

## FORMATO DE PRESENTACIONES (mode SLIDES)
Cuando el usuario te pida crear, diseñar o generar una presentación o un archivo PPT, estructura TODA tu respuesta en formato listo para copiar y pegar en plantillas de PowerPoint. Usa exactamente este esquema por diapositiva:

[SLIDE 1 - TÍTULO DE LA PORTADA]
Título: ...
Subtítulo: ...

[SLIDE 2 - NOMBRE DE LA SECCIÓN]
• Viñeta 1
• Viñeta 2
• Viñeta 3

[SLIDE 3 - NOMBRE DE LA SECCIÓN]
...

Reglas del formato de presentación:
- Numerar siempre las diapositivas (SLIDE 1, SLIDE 2, etc.)
- Escribir el título de cada diapositiva en MAYÚSCULAS después del guion
- Usar viñetas (•) para el contenido de cada diapositiva, máximo 4-5 por diapositiva
- Texto breve y directo, listo para pegar en la página de PowerPoint
- Mantener la coherencia pedagógica del taller o tema activo

## MODOS INTERNOS
AIMA puede operar en CREATE, FACILITATE, SLIDES, ANALYZE, IMMERSIVE según la intención del usuario, detectada automáticamente sin selección manual.

## REGLA FINAL
AIMA NO debe intentar ser una IA universal. Es contextual, especializada, enfocada, pedagógica y metodológica.`;
    }

    // --- System Prompt (inicial con tono por defecto) ---
    let systemPrompt = buildSystemPrompt(aiTone);
    // --- History for Context ---
    let chatHistory = [];
    try {
        const savedHistory = localStorage.getItem('aimaChatHistory');
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
        }
    } catch (e) {
        console.error("No se pudo cargar el historial de chat:", e);
    }

    // --- Initialize Robot ---
    const robot = new PixelRobot('robot-canvas');

    // --- Speech Synthesis (Text to Speech) ---
    const synth = window.speechSynthesis;
    let voice = null;
    
    function loadVoices() {
        const voices = synth.getVoices();
        const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
        
        if (spanishVoices.length > 0) {
            // Nombres comunes de voces femeninas
            const femaleNames = ['sabina', 'helena', 'laura', 'monica', 'paulina', 'victoria', 'google español', 'es-es-standard-a'];
            
            let femaleVoice = spanishVoices.find(v => {
                const name = v.name.toLowerCase();
                return femaleNames.some(fem => name.includes(fem));
            });
            
            // Si no encuentra una mujer, evitar voces masculinas conocidas
            if (!femaleVoice) {
                const maleNames = ['pablo', 'diego', 'jorge'];
                femaleVoice = spanishVoices.find(v => {
                    return !maleNames.some(male => v.name.toLowerCase().includes(male));
                });
            }
            
            voice = femaleVoice || spanishVoices[0];
        } else {
            voice = voices[0];
        }
    }
    
    synth.onvoiceschanged = loadVoices;
    
    function speak(text) {
        if (synth.speaking) {
            synth.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        if (voice) utterance.voice = voice;
        utterance.rate = 1.0;
        utterance.pitch = 1.2;
        
        utterance.onstart = () => {
            isTalking = true;
            robot.setState('talking');
            updateUIState();
        };
        
        utterance.onboundary = (e) => {
            // Sincroniza la boca: un pulso por cada palabra detectada por el motor de voz
            if (e.name === 'word' || e.name === 'sentence') {
                robot.pulseMouth();
            }
        };
        
        utterance.onend = () => {
            isTalking = false;
            robot.setState('idle');
            updateUIState();
        };
        
        utterance.onerror = (e) => {
            console.error('Speech synthesis error', e);
            isTalking = false;
            robot.setState('idle');
            updateUIState();
        };
        
        synth.speak(utterance);
    }

    // --- Speech Recognition (Voice to Text) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let finalTranscript = '';
    let silenceTimer = null;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-CO'; // Colombian Spanish
        
        recognition.onstart = () => {
            isListening = true;
            finalTranscript = '';
            robot.setState('listening');
            updateUIState();
            userText.textContent = "Escuchando...";
            aimaText.textContent = "";
            
            // Auto-stop if no speech is detected at all
            silenceTimer = setTimeout(() => {
                if (isListening) recognition.stop();
            }, 5000);
        };
        
        recognition.onresult = (event) => {
            if (silenceTimer) clearTimeout(silenceTimer);
            
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            userText.textContent = `Tú: "${finalTranscript + interimTranscript}"`;
            
            // Mostrar tarjeta de usuario en tiempo real
            const transcriptText = finalTranscript + interimTranscript;
            if (!currentUserCard || event.results[event.resultIndex].isFinal) {
                currentUserCard = createMessageCard('user', transcriptText);
            } else {
                updateMessageCard(currentUserCard, transcriptText);
            }
            
            // Check for local voice commands (timer, etc.) before sending to AI
            const spokenText = finalTranscript + interimTranscript;
            if (parseVoiceCommands(spokenText)) {
                // Local command handled, don't send to AI
                silenceTimer = setTimeout(() => {
                    if (isListening) recognition.stop();
                }, 1500);
                return;
            }
            
            // Auto-stop after 2.5 seconds of silence
            silenceTimer = setTimeout(() => {
                if (isListening) recognition.stop();
            }, 2500);
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            isListening = false;
            robot.setState('idle');
            updateUIState();
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                statusText.textContent = "Permiso de micrófono denegado. Actívalo en el navegador.";
            } else {
                statusText.textContent = "Error al escuchar. Intenta de nuevo.";
            }
        };
        
        recognition.onend = () => {
            if (silenceTimer) clearTimeout(silenceTimer);
            
            if (isListening) {
                isListening = false;
                robot.setState('idle');
                updateUIState();
                
                const textToSend = finalTranscript.trim();
                if (textToSend) {
                    callGeminiAPI(textToSend);
                } else {
                    statusText.textContent = "No escuché nada.";
                }
            }
        };
    } else {
        alert("Tu navegador no soporta Web Speech API. Usa Chrome o Edge para la transcripción de voz.");
    }

    // --- UI State Management ---
    function scrollTranscriptToBottom() {
        if (transcriptContent) {
            transcriptContent.scrollTop = transcriptContent.scrollHeight;
        }
    }

    function updateUIState() {
        // Update robot visual state based on activity
        if (isThinking) {
            robot.setState('thinking');
            currentStatus = { text: 'Pensando...', type: 'thinking' };
        } else if (isListening) {
            robot.setState('listening');
            currentStatus = { text: 'Te escucho...', type: 'listening' };
        } else if (isTalking) {
            robot.setState('talking');
            currentStatus = { text: 'Hablando...', type: 'talking' };
        } else {
            robot.setState('idle');
            currentStatus = { text: '', type: 'idle' };
        }

        // Update big status card
        updateStatusCard();

        // Update mic button UI classes and status text
        if (micBtn) {
            micBtn.className = '';
            if (isListening) {
                micBtn.classList.add('listening');
                statusText.textContent = "Te escucho...";
            } else if (isThinking) {
                micBtn.classList.add('thinking');
                statusText.textContent = "Pensando...";
            } else if (isTalking) {
                micBtn.classList.add('talking');
                statusText.textContent = "Hablando...";
            } else {
                micBtn.classList.add('idle');
                statusText.textContent = "";
            }
        }

        // Update stop button UI classes based on talking state
        if (stopBtn) {
            stopBtn.className = '';
            if (isTalking) {
                stopBtn.classList.add('talking');
            } else {
                stopBtn.classList.add('idle');
            }
        }
    }

    function updateStatusCard() {
        const card = document.getElementById('status-card');
        const statusTextEl = document.getElementById('status-card-text');
        const statusIcon = document.getElementById('status-card-icon');
        if (!card || !statusTextEl || !statusIcon) return;

        statusTextEl.textContent = currentStatus.text;

        const icons = {
            idle: '🎙️',
            listening: '👂',
            thinking: '🤔',
            talking: '🗣️',
            success: '✅',
            error: '❌',
            confused: '🤷‍♂️',
            celebrating: '🎉'
        };
        statusIcon.textContent = icons[currentStatus.type] || '🎙️';

        card.className = 'status-card ' + currentStatus.type;
        
        // Cambiar borde del canvas según estado
        const canvas = document.getElementById('robot-canvas');
        if (canvas) {
            canvas.className = '';
            const borderMap = {
                idle: '', listening: 'border-listening', thinking: 'border-thinking',
                talking: 'border-talking', success: 'border-success', error: 'border-error',
                confused: 'border-thinking', celebrating: 'border-success'
            };
            const cls = borderMap[currentStatus.type];
            if (cls) canvas.classList.add(cls);
        }
    }

    // --- Message cards ---
    function createMessageCard(role, text) {
        const isUser = role === 'user';
        const card = document.createElement('div');
        card.className = `message-card ${isUser ? 'message-user' : 'message-aima'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = isUser ? '👤' : '🤖';
        
        const body = document.createElement('div');
        body.className = 'message-body';
        
        const label = document.createElement('div');
        label.className = 'message-label';
        label.textContent = isUser ? 'TÚ' : 'AIMA';
        
        const textEl = document.createElement('div');
        textEl.className = 'message-text';
        textEl.textContent = text;
        
        body.appendChild(label);
        body.appendChild(textEl);
        card.appendChild(avatar);
        card.appendChild(body);
        
        transcriptContent.appendChild(card);
        scrollTranscriptToBottom();
        return card;
    }
    
    function updateMessageCard(card, text) {
        const textEl = card.querySelector('.message-text');
        if (textEl) textEl.textContent = text;
        scrollTranscriptToBottom();
    }

    function clearMessageCards() {
        transcriptContent.innerHTML = '';
        currentUserCard = null;
        currentAimaCard = null;
    }

    // --- Timer / Pomodoro ---
    function startTimer(minutes, label) {
        if (timerRunning) stopTimer();
        timerSeconds = minutes * 60;
        timerInitialSeconds = minutes * 60;
        timerLabel = label || 'Temporizador';
        timerRunning = true;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timerSeconds--;
            if (timerSeconds <= 0) {
                stopTimer();
                robot.setState('celebrating');
                currentStatus = { text: `⏰ ${timerLabel} terminado`, type: 'celebrating' };
                updateStatusCard();
                if (synth && !synth.speaking) {
                    speak(`¡El ${timerLabel} ha terminado!`);
                }
                setTimeout(() => {
                    robot.setState('idle');
                    currentStatus = { text: '', type: 'idle' };
                    updateStatusCard();
                }, 3000);
            } else {
                updateTimerDisplay();
            }
        }, 1000);
    }

    function stopTimer() {
        timerRunning = false;
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        const container = document.getElementById('timer-display');
        const labelEl = document.getElementById('timer-label');
        const barEl = document.getElementById('timer-bar');
        const timeEl = document.getElementById('timer-time');
        if (!container) return;
        if (timerRunning && timerSeconds > 0) {
            const m = Math.floor(timerSeconds / 60);
            const s = timerSeconds % 60;
            labelEl.textContent = timerLabel;
            timeEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
            const pct = timerInitialSeconds > 0 ? Math.max(0, (timerSeconds / timerInitialSeconds) * 100) : 100;
            barEl.style.width = `${pct}%`;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    function parseVoiceCommands(text) {
        const t = text.toLowerCase().trim();
        // Timer commands: "pon un temporizador de X minutos", "inicia pomodoro", "cronómetro X"
        const timerMatch = t.match(/temporizador de (\d+)\s*min/i) || t.match(/(\d+)\s*min/i);
        const pomodoroMatch = t.includes('pomodoro') || t.includes('pomodoro');
        if (timerMatch) {
            const mins = parseInt(timerMatch[1]);
            if (mins > 0 && mins <= 120) {
                startTimer(mins, 'Temporizador');
                return true;
            }
        }
        if (pomodoroMatch) {
            startTimer(25, 'Pomodoro');
            return true;
        }
        // Stop timer
        if (t.includes('detener temporizador') || t.includes('para el cronómetro') || t.includes('cancela el temporizador')) {
            stopTimer();
            robot.setState('idle');
            currentStatus = { text: 'Temporizador detenido', type: 'idle' };
            updateStatusCard();
            return true;
        }
        return false;
    }
    async function callGeminiAPI(promptText) {

        // 1. Obtener la API Key desde la pantalla o localStorage
        const key = apiKeyInput.value.trim() || apiKey || localStorage.getItem('aima_gemini_key');

        if (!key) {
            alert("Por favor ingresa tu Gemini API Key de Google AI Studio.");
            isThinking = false;
            updateUIState();
            return;
        }

        // Guardar la llave localmente para no tener que ingresarla siempre
        localStorage.setItem('aima_gemini_key', key);
        apiKey = key;

        isThinking = true;
        updateUIState();
        currentAimaCard = createMessageCard('aima', "...");

        try {
            // 2. Preparar el historial de chat para Gemini
            const contents = [];

            // Always include system prompt as first user message
            if (chatHistory.length === 0) {
                contents.push({
                    role: "user",
                    parts: [{ text: systemPrompt }]
                });
                contents.push({
                    role: "model",
                    parts: [{ text: "Entendido. Estoy en Modo Emprendedor listo para ayudar." }]
                });
            }

            // Add previous chat history
            chatHistory.forEach(msg => {
                contents.push({
                    role: msg.role === "model" ? "model" : "user",
                    parts: [{ text: msg.parts ? msg.parts[0].text : msg.content }]
                });
            });

            // Preparar el mensaje actual con el contenido del archivo si fue adjuntado
            let fullPromptText = promptText;
            if (attachedFile && attachedFile.content) {
                fullPromptText = `[DOCUMENTO Y CONTEXTO ADJUNTO "${attachedFile.name}"]:\n${attachedFile.content}\n\n[INSTRUCCIÓN / PREGUNTA]:\n${promptText}`;
            } else if (attachedFile) {
                fullPromptText = `[ARCHIVO ADJUNTO]: ${attachedFile.name}\n\n[INSTRUCCIÓN / PREGUNTA]:\n${promptText}`;
            }

            const currentMessage = {
                role: "user",
                parts: [{ text: fullPromptText }]
            };
            contents.push(currentMessage);

            // 3. Petición directa a Google AI Studio con fallback entre modelos
            const modelsToTry = [activeModel, ...geminiFallbackModels.filter(m => m !== activeModel)];
            let aimaResponse = null;
            let lastError = null;

            for (const model of modelsToTry) {
                try {
                    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            systemInstruction: {
                                parts: [{ text: systemPrompt }]
                            },
                            contents: contents,
                            generationConfig: {
                                temperature: 0.2, // Baja temperatura para ceñirse estrictamente al contexto
                                maxOutputTokens: 800
                            }
                        })
                    });

                    const data = await response.json();

                    // Imprimir la respuesta real en la consola de desarrollo para ver el detalle si falla
                    console.log(`Respuesta de Gemini API (${model}):`, data);

                    // Retryable si el modelo está saturado o no disponible
                    if (!response.ok || data.error) {
                        const status = response.status;
                        const errorDetail = data.error ? data.error.message : response.statusText;
                        const retryable = status === 429 || status === 503 || status === 404 || status === 400;
                        const error = new Error(`[Status ${status}] ${errorDetail} (modelo: ${model})`);
                        if (retryable) {
                            lastError = error;
                            console.warn(`Modelo ${model} falló (${status}), probando siguiente...`);
                            continue;
                        }
                        throw error;
                    }

                    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
                        lastError = new Error(`La API no devolvió texto en la respuesta (modelo: ${model}).`);
                        console.warn(`Modelo ${model} no devolvió texto, probando siguiente...`);
                        continue;
                    }

                    aimaResponse = data.candidates[0].content.parts[0].text;
                    activeModel = model; // Quedarse con el modelo que funcionó
                    break;

                } catch (e) {
                    lastError = e;
                    console.warn(`Error con modelo ${model}:`, e.message);
                }
            }

            if (!aimaResponse) {
                throw lastError || new Error("Ningún modelo respondió.");
            }

            aimaResponse = aimaResponse.replace(/[*#_`~]/g, '').trim();

            // 5. Guardar en historial
            chatHistory.push({ role: "user", parts: [{ text: promptText }] });
            chatHistory.push({ role: "model", parts: [{ text: aimaResponse }] });

            if (chatHistory.length > 20) {
                chatHistory = chatHistory.slice(chatHistory.length - 20);
            }
            localStorage.setItem('aimaChatHistory', JSON.stringify(chatHistory));

            // 6. Mostrar respuesta y hablar
            aimaText.textContent = aimaResponse;
            scrollTranscriptToBottom();
            isThinking = false;
            robot.setState('success');
            currentStatus = { text: 'Respuesta lista', type: 'success' };
            updateStatusCard();
            speak(aimaResponse);

        } catch (error) {
            console.error("Error en AI Studio API:", error);
            // Fallback a Groq
            try {
                const groqKey = openaiKeyInput.value.trim() || openaiKey || localStorage.getItem('aima_groq_key');
                if (!groqKey) {
                    throw new Error("No hay API Key de Groq configurada.");
                }
                openaiKey = groqKey;
                localStorage.setItem('aima_groq_key', groqKey);
                await callOpenAIAPI(promptText);
                return;
            } catch (groqError) {
                console.error("Error en Groq:", groqError);
            }
            isThinking = false;
            robot.setState('error');
            currentStatus = { text: 'Error de conexión', type: 'error' };
            updateStatusCard();
            updateUIState();
            const errMsg = `Error: ${error.message || "Verifica tu API Key o conexión."}`;
            currentAimaCard = createMessageCard('aima', errMsg);
            speak("Ocurrió un problema de conexión con Google AI Studio y Groq.");
        }
    }

    // --- OpenAI API Fallback ---
    async function callOpenAIAPI(promptText) {
        try {
            const messages = [
                { role: "system", content: systemPrompt }
            ];
            
            chatHistory.forEach(msg => {
                messages.push({
                    role: msg.role === "model" ? "assistant" : "user",
                    content: msg.parts[0].text
                });
            });
            
            const currentMessage = { role: "user", content: promptText };
            messages.push(currentMessage);
            
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: activeGroqModel,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 800
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message);
            }
            
            let aimaResponse = data.choices[0].message.content;
            aimaResponse = aimaResponse.replace(/[*#_`~]/g, '').trim();
            
            chatHistory.push({ role: "user", parts: [{ text: promptText }] });
            chatHistory.push({ role: "model", parts: [{ text: aimaResponse }] });
            if (chatHistory.length > 20) {
                chatHistory = chatHistory.slice(chatHistory.length - 20);
            }
            localStorage.setItem('aimaChatHistory', JSON.stringify(chatHistory));
            
            aimaText.textContent = aimaResponse;
            scrollTranscriptToBottom();
            isThinking = false;
            speak(aimaResponse);
            
        } catch (error) {
            console.error("Groq API Error:", error);
            isThinking = false;
            updateUIState();
            currentAimaCard = createMessageCard('aima', "Ambos servidores fallaron o la llave de Groq es inválida.");
        }
    }

    // --- Event Listeners ---
    startBtn.addEventListener('click', async () => {
        console.log('Start button clicked (Modo Local)');
        
        setupScreen.classList.remove('active');
        avatarScreen.classList.add('active');
        // Initialize voice on first user interaction
        loadVoices();
        
        statusText.textContent = "";
    });
    
    // --- Microphone permission (se solicita una vez y se mantiene activa) ---
    async function ensureMicPermission() {
        if (!micStream) {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        return micStream;
    }

    micBtn.addEventListener('click', async () => {
        if (isThinking || isTalking) return;
        
        if (isListening) {
            recognition.stop();
        } else {
            statusText.textContent = "Activando micrófono...";
            try {
                // Pre-calienta el permiso del micrófono (evita que Chrome lo pida cada vez)
                await ensureMicPermission();
                if (!isListening) {
                    recognition.start();
                }
            } catch (err) {
                console.error('Micrófono no disponible', err);
                statusText.textContent = "Permiso de micrófono denegado. Actívalo en el navegador.";
            }
        }
    });
    
    // Stop speaking button handler
    stopBtn.addEventListener('click', () => {
        if (synth.speaking) {
            synth.cancel();
        }
        isTalking = false;
        robot.setState('idle');
        updateUIState();
    });
    
    // --- Text Input Handlers ---
    const textInput = document.getElementById('text-input');
    const sendTextBtn = document.getElementById('send-text-btn');
    
    function sendTextInput() {
        if (isThinking || isTalking) return;
        const text = textInput.value.trim();
        if (text) {
            currentUserCard = createMessageCard('user', text);
            textInput.value = '';
            callGeminiAPI(text);
        }
    }
    
    sendTextBtn.addEventListener('click', sendTextInput);
    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendTextInput();
    });

    // --- Export History ---
    const exportBtn = document.getElementById('export-btn');
    exportBtn.addEventListener('click', () => {
        // Build transcript from chatHistory
        let transcript = '';
        chatHistory.forEach((msg, idx) => {
            const role = msg.role === 'user' ? 'Tú' : 'AIMA';
            const text = msg.parts[0].text.replace(/[*#_`~]/g, '').trim();
            transcript += `${role}: ${text}\n\n`;
        });
        const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'aima_transcript.txt';
        a.click();
        URL.revokeObjectURL(url);
    });

    // --- Copy Content Button ---
    copyBtn.addEventListener('click', async () => {
        // Copiar el último mensaje de AIMA del historial
        let contentToCopy = '';
        for (let i = chatHistory.length - 1; i >= 0; i--) {
            if (chatHistory[i].role === 'model') {
                contentToCopy = chatHistory[i].parts ? chatHistory[i].parts[0].text : chatHistory[i].content;
                break;
            }
        }
        contentToCopy = contentToCopy.replace(/[*#_`~]/g, '').trim();
        if (contentToCopy && contentToCopy !== '...' && contentToCopy !== '') {
            try {
                await navigator.clipboard.writeText(contentToCopy);
                copyBtn.textContent = '✓ Copiado';
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.textContent = '📋 Copiar';
                    copyBtn.classList.remove('copied');
                }, 2000);
            } catch (e) {
                // Fallback para navegadores sin clipboard API
                const textarea = document.createElement('textarea');
                textarea.value = contentToCopy;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                copyBtn.textContent = '✓ Copiado';
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.textContent = '📋 Copiar';
                    copyBtn.classList.remove('copied');
                }, 2000);
            }
        } else {
            copyBtn.textContent = 'Sin contenido';
            setTimeout(() => {
                copyBtn.textContent = '📋 Copiar';
            }, 1500);
        }
    });

    // --- Clear History ---
    clearBtn.addEventListener('click', () => {
        chatHistory = [];
        localStorage.removeItem('aimaChatHistory');
        clearMessageCards();
        statusText.textContent = langSelect.value === 'es' ? 'Historial borrado' : 'History cleared';
        setTimeout(() => {
            statusText.textContent = "";
        }, 1500);
    });

    // --- Language Selector ---
    const langSelect = document.getElementById('lang-select');
    const setLanguage = (lang) => {
        const texts = {
            es: {
                startBtn: 'Iniciar Avatar',
                micBtnTitle: 'Hablar',
                fileBtnTitle: 'Adjuntar Archivo (Word, Excel, PowerPoint, PDF, Imagen)',
                statusPresiona: "",
                listening: 'Te escucho...',
                thinking: 'Pensando...',
                talking: 'Hablando...',
                exportTitle: 'Exportar historial',
                clearTitle: 'Borrar historial',
                copyLabel: '📋 Copiar',
                exportLabel: '📥 Exportar',
                clearLabel: '🗑️ Borrar',
                presentationTitle: 'Modo Presentación',
                themeTitle: 'Modo Oscuro/Claro'
            },
            en: {
                startBtn: 'Start Avatar',
                micBtnTitle: 'Speak',
                fileBtnTitle: 'Attach File (Word, Excel, PowerPoint, PDF, Image)',
                statusPresiona: "",
                listening: 'Listening...',
                thinking: 'Thinking...',
                talking: 'Talking...',
                exportTitle: 'Export History',
                clearTitle: 'Clear History',
                copyLabel: '📋 Copy',
                exportLabel: '📥 Export',
                clearLabel: '🗑️ Clear',
                presentationTitle: 'Presentation Mode',
                themeTitle: 'Dark/Light Mode'
            }
        };
        const t = texts[lang];
        document.getElementById('start-btn').textContent = t.startBtn;
        document.getElementById('mic-btn').title = t.micBtnTitle;
        document.getElementById('file-btn').title = t.fileBtnTitle;
        statusText.textContent = t.statusPresiona;
        document.getElementById('export-btn').title = t.exportTitle;
        document.getElementById('clear-btn').title = t.clearTitle;
        document.getElementById('copy-btn').textContent = t.copyLabel;
        document.getElementById('export-btn').textContent = t.exportLabel;
        document.getElementById('clear-btn').textContent = t.clearLabel;
        document.getElementById('presentation-btn').title = t.presentationTitle;
        document.getElementById('theme-toggle').title = t.themeTitle;
    };
    // Initialize language based on saved preference
    const savedLang = localStorage.getItem('aimaLang') || 'es';
    langSelect.value = savedLang;
    setLanguage(savedLang);
    langSelect.addEventListener('change', (e) => {
        const lang = e.target.value;
        localStorage.setItem('aimaLang', lang);
        setLanguage(lang);
    });

    // --- Tone Selector ---
    const toneSelect = document.getElementById('tone-select');
    toneSelect.addEventListener('change', (e) => {
        aiTone = e.target.value;
        // Rebuild system prompt with new tone
        systemPrompt = buildSystemPrompt(aiTone);
        // Notify user briefly
        const toneNames = {
            profesional: 'Profesional',
            cercano: 'Cercano',
            entusiasta: 'Entusiasta',
            divertido: 'Divertido'
        };
        statusText.textContent = `Tono: ${toneNames[aiTone]}`;
        setTimeout(() => {
            statusText.textContent = "";
        }, 1500);
    });

    // --- Presentation Mode ---
    const presentationBtn = document.getElementById('presentation-btn');
    presentationBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('presentation');
    });

    // --- File Upload Progress Simulation ---
    const uploadProgress = document.getElementById('upload-progress');
    const uploadBar = document.getElementById('upload-bar');
    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Simulate progress
        uploadProgress.style.display = 'block';
        uploadBar.style.width = '0%';
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10 + Math.random() * 15; // random increment
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    uploadProgress.style.display = 'none';
                }, 500);
            }
            uploadBar.style.width = `${progress}%`;
        }, 150);
    });

    // --- File Attachment Listeners ---
    fileBtn.addEventListener('click', () => {
        fileUpload.click();
    });

    fileUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            attachedFile = {
                name: file.name,
                type: file.type,
                content: e.target.result // Guarda el texto del archivo
            };

            fileNameSpan.textContent = file.name;
            fileIndicator.style.display = 'flex';
            fileBtn.style.outline = '2px solid var(--primary)';
        };

        // Leer archivos de texto, markdown, json, csv o notas
        if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            attachedFile = { name: file.name, type: file.type, content: null };
            fileNameSpan.textContent = file.name;
            fileIndicator.style.display = 'flex';
            fileBtn.style.outline = '2px solid var(--primary)';
        }

        // Reset input so the same file can be selected again later
        fileUpload.value = '';
    });

    removeFileBtn.addEventListener('click', () => {
        attachedFile = null;
        fileIndicator.style.display = 'none';
        fileBtn.style.outline = 'none';
    });
    // --- Theme Toggle ---
    const themeToggle = document.getElementById('theme-toggle');
    
    function updateThemeIcon() {
        const current = document.documentElement.className;
        // Show the icon of the theme that will be activated on next click
        themeToggle.textContent = current === 'dark' ? '☀️' : '🌙';
    }
    
    // Apply saved theme or default dark
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.className = savedTheme;
    } else {
        document.documentElement.className = 'dark';
    }
    updateThemeIcon();
    
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.className;
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.className = newTheme;
        localStorage.setItem('theme', newTheme);
        updateThemeIcon();
    });

}); // end of DOMContentLoaded
