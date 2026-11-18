/**
 * Detecta equipos que dibujan sin tarjeta gráfica (driver genérico de Windows, SwiftShader, etc.).
 * En esos equipos cada animación de fondo le quita fluidez a la ruleta, así que conviene el modo ligero.
 */
export function detectLowPowerGraphics(): boolean {
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /basic render|swiftshader|llvmpipe|software|microsoft basic/i.test(renderer);
  } catch {
    return false;
  }
}
