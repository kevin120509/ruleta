/** Lectura/escritura segura en localStorage (no truena si está lleno o bloqueado). */

export function loadJSON<T>(key: string, fallback: T, legacyKeys: string[] = []): T {
  for (const k of [key, ...legacyKeys]) {
    try {
      const raw = localStorage.getItem(k);
      if (raw != null) return JSON.parse(raw) as T;
    } catch {
      /* dato corrupto: probar la siguiente llave */
    }
  }
  return fallback;
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('No se pudo guardar en el navegador', key, e);
  }
}

/** Convierte el campo timestamp (texto en el JSON guardado) de vuelta a fecha. */
export function reviveDates<T extends { timestamp: Date | string }>(list: T[]): T[] {
  if (!Array.isArray(list)) return [];
  return list.map(item => ({ ...item, timestamp: new Date(item.timestamp) }));
}
