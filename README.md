# AIMA Avatar

Asistente pedagógico con avatar (AIMA) para diseñar, facilitar y apoyar experiencias de aprendizaje. Funciona con **Gemini API** (remota) o con **llama-server** (local, offline), y dispone de voz, modo presentación, panel de contenido, temporizador Pomodoro, selector de personalidad y avatar expresivo.

> ⚠️ **Nunca subas tu API Key real a este repositorio.** Lee la sección [Seguridad](#seguridad) antes de hacer commit.

---

## ¿Qué incluye?

| Archivo | Función |
|---------|---------|
| `index.html` | Interfaz: avatar, controles, panel de contenido, modo presentación, selector de tono, temporizador, tarjeta de estado |
| `style.css` | Estilos, layout dos columnas, responsive móvil, modo presentación, tarjeta de estado animada |
| `app_local.js` | Lógica principal: Gemini + llama-server, voz, reconocimiento, comandos de voz, temporizador, tono |
| `robot.js` | Dibujo del avatar en canvas (rostro animado con 8 estados + animaciones de ocio) |
| `localModel.js` | Integración opcional con modelo local (llama.cpp) |
| `system_prompt.txt` | Prompt de sistema de AIMA (para uso offline) |
| `start_aima.bat` | Arranca servidor web (puerto 8000) + llama-server (puerto 8080) |
| `install_aima.ps1` | Script de instalación en PowerShell |

---

## Características principales

### 🤖 Avatar expresivo (8 estados)
El avatar ahora muestra distintos estados según lo que está haciendo:
- **Idle** — reposo, parpadeo, mira alrededor
- **Listening** — te escucha (ojos atentos, rojo)
- **Talking** — habla (boca sincronizada palabra por palabra)
- **Thinking** — piensa (ojos hacia arriba, ámbar)
- **Success** — respuesta lista (sonrisa amplia, verde)
- **Error** — error de conexión (ceño fruncido, rojo)
- **Confused** — confusión (boca ondulada, ámbar)
- **Celebrating** — celebración (sonrisa grande, magenta)

También tiene **animaciones de ocio**: cuando no hay actividad, parpadea, mira a los lados o hacia arriba sutilmente.

### 🎭 Selector de personalidad (tono)
Elige cómo quiere que hable AIMA:
| Tono | Descripción |
|------|-------------|
| 🎩 Profesional | Claro, moderno, práctico (defecto) |
| 🤝 Cercano | Cálido, accesible, como un colega |
| 🔥 Entusiasta | Motivador, energético, ritmo ágil |
| 😄 Divertido | Ligero, humor sutil, ameno |

Cambia el tono desde el desplegable junto al selector de idioma. El cambio se aplica inmediatamente a las nuevas respuestas.

### ⏱️ Temporizador / Pomodoro por voz
AIMA entiende comandos de voz para temporizadores:
- **"Pon un temporizador de 10 minutos"** → inicia cuenta atrás
- **"Pomodoro"** → inicia 25 minutos (método Pomodoro clásico)
- **"Detener temporizador"** → cancela la cuenta atrás

Cuando termina, el avatar celebra y avisa por voz. Se muestra una cuenta atrás grande en pantalla.

### 📋 Tarjeta de estado grande
Una tarjeta visible en la parte inferior del avatar muestra el estado actual de un vistazo (ideal para proyectar en clase o ver desde lejos).

### 🎙️ Voz sincronizada
La boca del avatar se abre y cierra al ritmo de las palabras reales que dice la síntesis de voz (usa eventos `onboundary` del navegador), no movimiento aleatorio.

### 📎 Panel de contenido
- 📋 **Copiar** — copia la última respuesta al portapapeles
- 📥 **Exportar** — descarga el historial como `.txt`
- 🗑️ **Borrar** — limpia el historial y empieza conversación nueva

### 🎞️ Modo presentación
Oculta todo excepto el avatar y los controles esenciales. Todo cabe en pantalla sin scroll (ajustado para 100vh).

### 📱 Responsive móvil
Se adapta a pantallas pequeñas (<=600px): canvas más compacto, botones táctiles sin retardo, panel de ancho completo.

---

## Requisitos

- Navegador moderno (Chrome, Edge, Firefox o Safari).
- Para voz: Chrome o Edge (Web Speech API).
- **Opción A (remota):** API Key de [Google AI Studio (Gemini)](https://aistudio.google.com/app/apikey).
- **Opción B (local/offline):** llama-server ejecutándose en `http://localhost:8080` y un modelo `.gguf` descargado aparte.

---

## Instalación rápida

1. Clona el repositorio:

```bash
git clone https://github.com/TU-USUARIO/aima-avatar.git
cd aima-avatar
```

2. (Opcional) Instala dependencias locales si usarás llama-server:

```powershell
# Windows PowerShell
.\install_aima.ps1
```

3. Ejecuta AIMA:

```powershell
.\start_aima.bat
```

Esto levanta:
- Servidor web estático en `http://localhost:8000`
- llama-server en `http://localhost:8080` (si está disponible)

4. Abre `http://localhost:8000` en tu navegador.

---

## Configuración

Al abrir la pantalla de configuración:

1. Pega tu **Gemini API Key** (obténla en [aistudio.google.com](https://aistudio.google.com/app/apikey)).
2. Opcionalmente, pega tu **Groq API Key** como cerebro de respaldo (Llama 3, gratis y rápido): [console.groq.com/keys](https://console.groq.com/keys).
3. Elige el **tono** de AIMA desde el desplegable.
4. Haz clic en **Iniciar Avatar**.

---

## Uso

| Acción | Qué hace |
|--------|----------|
| 🎙️ Micrófono | Inicia reconocimiento de voz |
| ⏹️ Detener | Detiene la voz y el reconocimiento |
| 📎 Archivo | Adjunta `.txt`, `.md`, `.json`, `.csv`, PDF, etc. |
| 🎞️ Modo Presentación | Interfaz limpia para presentar, sin scroll |
| 📋 Copiar | Copia la última respuesta de AIMA |
| 📥 Exportar | Descarga el historial como `.txt` |
| 🗑️ Borrar | Limpia el historial |
| 🎭 Tono | Cambia la personalidad de AIMA |
| ⏱️ Voz: "temporizador de X min" | Inicia cuenta atrás |
| 🍅 Voz: "pomodoro" | Inicia temporizador de 25 min |

**Comandos de voz reconocidos localmente:**
- `"temporizador de X minutos"` — inicia cuenta atrás
- `"pomodoro"` — inicia 25 minutos
- `"detener temporizador"` — cancela cuenta atrás

Todo lo demás se envía a la IA para responder pedagógicamente.

---

## Ejecutar en tu celular

1. PC y celular deben estar en la **misma red WiFi**.
2. Desde el celular, abre el navegador y ve a:
   ```
   http://IP-DE-TU-PC:8000
   ```
3. Si usas **Gemini API** (remota), funciona directamente.
4. Si usas **llama-server local**, cambia en `app_local.js` la URL `http://localhost:8080` por la IP de tu PC.

---

## Estructura del repositorio (qué se sube y qué no)

**Sí se sube:**
- Código fuente de AIMA
- Scripts de arranque
- `system_prompt.txt`
- `.gitignore`
- `README.md`

**NO se sube (está en `.gitignore`):**
- `model/*.gguf` (modelo de lenguaje, varios GB)
- `build/` y binarios `.exe` / `.dll`
- `llama.cpp/` (código upstream)
- Claves de API, `.env`, logs y temporales

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| "API key retirada" o error 404 | Cambia el modelo en `app_local.js` a uno activo: `gemini-2.5-flash`, `gemini-flash-latest`, `gemini-3.5-flash` o `gemini-flash-lite-latest`. |
| No se oye nada / no reconoce voz | Usa Chrome o Edge. Permite el micrófono cuando te lo pida. |
| El celular no se conecta | Misma WiFi. Usa IP de tu PC, no `localhost`. |
| El avatar no cambia de tono | Recarga con Ctrl + F5 después de cambiar el tono. |
| El temporizador no suena al terminar | Asegúrate de que el navegador permita sonido (interactúa primero con la página). |

---

## Seguridad

- **No subas claves de API.** El `.gitignore` ignora `.env` y `*.key`, pero revisa `app_local.js` antes de hacer commit para asegurarte de que no hay claves hardcodeadas.
- Si accidentalmente subiste una clave, révoquíla inmediatamente y genera una nueva.

---

## Licencia

MIT. Úsalo, modifícalo y compártelo libremente.
