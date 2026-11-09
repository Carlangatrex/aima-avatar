// localModel.js – Wrapper for llama.cpp (CPU inference)
// Requires llama.cpp compiled binary (llama-cli.exe) placed in ./build/bin/Release
// Adjust paths if you use a different build location.
const path = require('path');
const { execFile } = require('node:child_process');

// Path to the compiled llama-cli executable (adjust if needed)
const LLAMA_EXE = path.resolve(__dirname, 'build', 'bin', 'Release', 'llama-cli.exe');
// Path to the quantized GGML model (must exist in ./model folder)
const MODEL_PATH = path.resolve(__dirname, 'model', 'llama-3-8b-q4_0.ggml');

/**
 * Generate a response from the local LLM.
 * @param {string} prompt The user prompt / instruction.
 * @returns {Promise<string>} The generated text.
 */
function generate(prompt) {
  return new Promise((resolve, reject) => {
    // llama-cli arguments: -m <model> -p <prompt> --temp 0.7 -n 200 (tokens)
    const args = ['-m', MODEL_PATH, '-p', prompt, '--temp', '0.7', '-n', '200'];
    execFile(LLAMA_EXE, args, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }
      // llama-cli prints the whole output; we trim any trailing newlines.
      resolve(stdout.trim());
    });
  });
}

module.exports = { generate };
