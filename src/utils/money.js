/**
 * Redondea a 2 decimales (céntimos).
 */
export const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/**
 * Precio en Bs a partir del precio de referencia en EUR y la tasa.
 * Devuelve null si no hay tasa configurada.
 */
export const toBs = (priceRef, rate) => (rate ? round2(priceRef * rate) : null);
