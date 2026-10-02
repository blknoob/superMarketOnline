/**
 * SERVICIO DE MARCAS
 *
 * Las marcas se crean solas al cargar un producto con una marca nueva,
 * así el administrador no necesita una pantalla aparte para ellas.
 */

import BrandsRepository from "../repositories/brands.repository.js";
import { slugify } from "../utils/slugify.js";

class BrandsService {
  constructor() {
    this.repository = new BrandsRepository();
  }

  getAll() {
    return this.repository.findAll({ isActive: true });
  }

  /**
   * Devuelve la marca con ese nombre, creándola si no existe.
   * Un nombre vacío significa "sin marca" y devuelve null.
   */
  async findOrCreate(name) {
    const trimmed = (name || "").trim();
    if (!trimmed) return null;
    const slug = slugify(trimmed);
    const existing = await this.repository.findBySlug(slug);
    if (existing) return existing;
    try {
      return await this.repository.create({ name: trimmed, slug });
    } catch (error) {
      // Otra petición la creó al mismo tiempo
      if (error.code === 11000) return this.repository.findBySlug(slug);
      throw error;
    }
  }
}

export default BrandsService;
