# AIMA Avatar

Asistente pedagógico con avatar (AIMA) para diseñar, facilitar y apoyar experiencias de aprendizaje. Funciona con **Gemini API** (remota) o con **llama-server** (local, offline), y dispone de voz, modo presentación y panel de contenido para copiar/exportar diapositivas.

> ⚠️ **Nunca subas tu API Key real a este repositorio.** Lee la sección [Seguridad](#seguridad) antes de hacer commit.

---

## ¿Qué incluye?

| Archivo | Función |
|---------|---------|
| `index.html` | Interfaz: avatar, controles, panel de contenido, modo presentación |
| `style.css` | Estilos, layout dos columnas, responsive móvil, modo presentación |
| `app_local.js` | Lógica principal: Gemini + llama-server, voz, reconocimiento, robot |
| `robot.js` | Dibujo del avatar en canvas (rostro animado) |
| `localModel.js` | Integración opcional con modelo local (llama.cpp) |
| `system_prompt.txt` | Prompt de sistema de AIMA (para uso offline) |
| `start_aima.bat` | Arranca servidor web (puerto 8000) + llama-server (puerto 8080) |
| `install_aima.ps1` | Script de instalación en PowerShell |

---

## Requisitos

- Navegador moderno (Chrome, Edge, Firefox o Safari).
- Para voz: Chrome o Edge (Web Speech API).
- **Opción A (remota):** API Key de [Google AI Studio (Gemini)](https://aistudio.google.com/app/apikey).
- **Opción B (local/offline):** llama-server ejecutándose en `http://localhost:8080` y un modelo `.gguf` descargado aparte (no está en este repo por su tamaño).

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
3. Haz clic en **Iniciar Avatar**.

> Si no quieres usar claves, puedes ejecutar `llama-server` localmente y apuntar `app_local.js` a tu IP local (ver [Solución de problemas](#solución-de-problemas)).

---

## Uso

| Acción | Qué hace |
|--------|----------|
| 🎙️ Micrófono | Inicia reconocimiento de voz (habla con AIMA) |
| ⏹️ Detener | Detiene la voz y el reconocimiento |
| 📎 Archivo | Adjunta `.txt`, `.md`, `.json`, `.csv`, PDF, etc. |
| 🎞️ Modo Presentación | Oculta todo menos el avatar y controles esenciales; cabe sin scroll |
| 📋 Copiar | Copia la última respuesta de AIMA al portapapeles |
| 📥 Exportar | Descarga el historial como `.txt` |
| 🗑️ Borrar | Limpia el historial y empieza conversación nueva |

**Modo presentación:** todo se ajusta a la pantalla sin hacer scroll. Pulsa de nuevo 🎞️ para salir.

---

## Ejecutar en tu celular

1. PC y celular deben estar en la **misma red WiFi**.
2. Desde el celular, abre el navegador y ve a:
   ```
   http://IP-DE-TU-PC:8000
   ```
   (ejemplo: `http://192.168.1.45:8000`)
3. Si usas **Gemini API** (remota), funciona directamente.
4. Si usas **llama-server local**, el celular no accede a `localhost` de tu PC. Cambia en `app_local.js`:
   ```js
   // Antes
   http://localhost:8080/v1/chat/completions
   // Después (usa la IP de tu PC en la red)
   http://192.168.1.X:8080/v1/chat/completions
   ```

---

## Estructura del repositorio (qué se sube y qué no)

**Sí se sube:**
- Código fuente de AIMA (`index.html`, `style.css`, `app_local.js`, `robot.js`, etc.)
- Scripts de arranque (`start_aima.bat`, `install_aima.ps1`)
- `system_prompt.txt`
- `.gitignore`

**NO se sube (está en `.gitignore`):**
- `model/*.gguf` (modelo de lenguaje, varios GB — descárgalo aparte)
- `build/` y binarios `.exe` / `.dll`
- `llama.cpp/` (código upstream; clónalo/compílalo aparte si lo necesitas)
- Claves de API, `.env`, logs y temporales

---

## Solución de problemas

| Problema | Posible causa / solución |
|----------|--------------------------|
| "API key retirada" o error 404 | Cambia el modelo en `app_local.js` a uno activo: `gemini-2.5-flash`, `gemini-flash-latest`, `gemini-3.5-flash` o `gemini-flash-lite-latest`. |
| No se oye nada / no reconoce voz | Usa Chrome o Edge. Asegúrate de permitir el micrófono cuando te lo pida el navegador. |
| El celular no se conecta | Ambos dispositivos en la misma WiFi. Usa la IP de tu PC, no `localhost`. |
| El avatar se ve pequeño | Se ajustó el canvas interno a 280×280 para que ocupe más espacio. |
| La boca no sincroniza con la voz | Se usa `onboundary` del Speech Synthesis para abrir la boca por palabra. |
| Se pide permiso del micrófono cada vez | Ahora se pre-calibra con `getUserMedia` una sola vez por sesión. |

---

## Seguridad

- **No subas claves de API.** El `.gitignore` ignora `.env` y `*.key`, pero revisa `app_local.js` antes de hacer commit para asegurarte de que no hay claves hardcodeadas.
- Si accidentalmente subiste una clave, révoquíla inmediatamente en Google AI Studio o Groq y genera una nueva.

---

## Licencia

MIT. Úsalo, modifícalo y compártelo libremente.
