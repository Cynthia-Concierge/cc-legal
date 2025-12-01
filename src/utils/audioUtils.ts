/**
 * Audio Utilities
 * Helper functions for audio processing in the voice widget
 */

/**
 * Decode base64 audio data
 */
export function decodeBase64(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Decode audio data and create AudioBuffer
 */
export async function decodeAudioData(
  audioData: ArrayBuffer,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  return await audioContext.decodeAudioData(audioData.slice(0));
}

/**
 * Create PCM blob from Float32Array audio data
 */
export function createPCMBlob(audioData: Float32Array): Blob {
  // Convert Float32Array to Int16Array (PCM format)
  const int16Array = new Int16Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    // Clamp to [-1, 1] and convert to 16-bit integer
    const s = Math.max(-1, Math.min(1, audioData[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // Create blob with PCM data
  return new Blob([int16Array.buffer], { type: 'audio/pcm' });
}

