/**
 * Convierte un texto en un identificador apto para URLs:
 * "Carnes y Pollo" → "carnes-y-pollo", "Bebés y Niños" → "bebes-y-ninos"
 */
export const slugify = (text) =>
  String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
