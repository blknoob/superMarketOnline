/**
 * SERVICIO DE PRODUCTOS - CATÁLOGO
 *
 * - Lista productos filtrando por categoría (incluye toda la rama),
 *   búsqueda de texto y paginación
 * - Agrega el precio en Bs calculado con la tasa EUR vigente
 * - Al crear o editar: valida categoría, crea la marca si es nueva,
 *   genera el slug y calcula categoryPath
 */

import ProductsRepository from "../repositories/products.repository.js";
import CategoriesService from "./categories.service.js";
import BrandsService from "./brands.service.js";
import SettingsService from "./settings.service.js";
import { PRODUCT_UNITS } from "../repositories/daos/mongo/models/products.model.js";
import { slugify } from "../utils/slugify.js";
import { toBs } from "../utils/money.js";

const DEFAULT_PAGE_SIZE = 24;

class ProductsService {
  constructor() {
    this.repository = new ProductsRepository();
    this.categoriesService = new CategoriesService();
    this.brandsService = new BrandsService();
    this.settingsService = new SettingsService();
  }

  /**
   * Lista paginada para la tienda o el panel.
   *
   * @param {Object} options
   * @param {string} [options.categorySlug] - Filtra por la categoría y sus descendientes
   * @param {string} [options.search] - Búsqueda de texto en nombre y descripción
   * @param {boolean} [options.includeInactive] - Incluir productos inactivos (panel admin)
   * @param {number} [options.page] - Página (desde 1)
   * @param {number} [options.limit] - Productos por página (0 = todos)
   * @returns {Promise<{products, category, page, pages, total, exchangeRate}>}
   */
  async list({ categorySlug, search, includeInactive = false, page = 1, limit = DEFAULT_PAGE_SIZE } = {}) {
    const filter = {};
    if (!includeInactive) filter.isActive = true;

    let category = null;
    if (categorySlug) {
      category = await this.categoriesService.getBySlug(categorySlug);
      if (!category) return { products: [], category: null, page: 1, pages: 0, total: 0, exchangeRate: null };
      filter.categoryPath = category._id;
    }
    if (search && search.trim()) filter.$text = { $search: search.trim() };

    page = Math.max(1, Number(page) || 1);
    const total = await this.repository.count(filter);
    const products = await this.repository.find(filter, {
      sort: { name: 1 },
      skip: limit ? (page - 1) * limit : 0,
      limit,
    });
    const exchangeRate = await this.settingsService.getExchangeRate();

    return {
      products: products.map((p) => withPrice(p, exchangeRate)),
      category,
      page,
      pages: limit ? Math.ceil(total / limit) : 1,
      total,
      exchangeRate,
    };
  }

  async getById(id) {
    const product = await this.repository.findById(id);
    if (!product) return null;
    return withPrice(product, await this.settingsService.getExchangeRate());
  }

  async create(data) {
    const fields = await this.prepare(data);
    if (await this.repository.findBySku(fields.sku)) {
      throw new Error(`Ya existe un producto con el SKU ${fields.sku}`);
    }
    fields.slug = await this.uniqueSlug(fields);
    try {
      return await this.repository.create(fields);
    } catch (error) {
      throw duplicateError(error) || error;
    }
  }

  async update(id, data) {
    const current = await this.repository.findById(id);
    if (!current) throw new Error("Producto no encontrado");

    const fields = await this.prepare({ ...flatten(current), ...data });
    if (fields.sku !== current.sku && (await this.repository.findBySku(fields.sku))) {
      throw new Error(`Ya existe un producto con el SKU ${fields.sku}`);
    }
    if (fields.name !== current.name || fields.unitSize !== current.unitSize || fields.unit !== current.unit) {
      fields.slug = await this.uniqueSlug(fields, id);
    }
    if (!data.images) delete fields.images;
    if (!fields.barcode) {
      delete fields.barcode;
      fields.$unset = { barcode: 1 };
    }
    try {
      return await this.repository.update(id, fields);
    } catch (error) {
      throw duplicateError(error) || error;
    }
  }

  async delete(id) {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new Error("Producto no encontrado");
    return deleted;
  }

  /**
   * Normaliza y valida los datos de un formulario o de la API.
   */
  async prepare(data) {
    const name = (data.name || "").trim();
    const sku = (data.sku || "").trim().toUpperCase();
    const priceRef = Number(data.priceRef);
    const stock = Number(data.stock);
    const unitSize = data.unitSize === undefined || data.unitSize === "" ? 1 : Number(data.unitSize);
    const unit = data.unit || "und";

    if (!name) throw new Error("El nombre es obligatorio");
    if (!sku) throw new Error("El SKU es obligatorio");
    if (!Number.isFinite(priceRef) || priceRef < 0) throw new Error("El precio de referencia debe ser un número mayor o igual a 0");
    if (!Number.isInteger(stock) || stock < 0) throw new Error("El stock debe ser un número entero mayor o igual a 0");
    if (!Number.isFinite(unitSize) || unitSize <= 0) throw new Error("El tamaño de la presentación debe ser mayor a 0");
    if (!PRODUCT_UNITS.includes(unit)) throw new Error(`Unidad inválida. Opciones: ${PRODUCT_UNITS.join(", ")}`);

    const category = data.category ? await this.categoriesService.getById(data.category) : null;
    if (!category) throw new Error("La categoría es obligatoria y debe existir");

    const brand = await this.brandsService.findOrCreate(data.brandName ?? data.brand);
    const barcode = (data.barcode || "").trim();

    return {
      name,
      description: (data.description || "").trim(),
      sku,
      barcode: barcode || undefined,
      brand: brand ? brand._id : null,
      category: category._id,
      categoryPath: [...category.ancestors.map((a) => a._id), category._id],
      unit,
      unitSize,
      priceRef,
      stock,
      images: Array.isArray(data.images) ? data.images : [],
      isActive: data.isActive === undefined ? true : data.isActive === true || data.isActive === "true" || data.isActive === "on",
    };
  }

  async uniqueSlug({ name, unitSize, unit }, excludeId = null) {
    const base = slugify(`${name} ${unitSize}${unit}`);
    for (let n = 1; ; n++) {
      const slug = n === 1 ? base : `${base}-${n}`;
      const existing = await this.repository.findBySlug(slug);
      if (!existing || String(existing._id) === String(excludeId)) return slug;
    }
  }
}

/**
 * Agrega price (Bs) e image (principal) a un producto.
 */
export const withPrice = (product, exchangeRate) => ({
  ...product,
  price: toBs(product.priceRef, exchangeRate),
  image: product.images?.[0] || null,
});

// Convierte un producto poblado en campos editables (ids en vez de objetos)
const flatten = (product) => ({
  ...product,
  brand: undefined,
  brandName: product.brand ? product.brand.name : "",
  category: product.category ? String(product.category._id) : null,
});

const duplicateError = (error) => {
  if (error.code !== 11000) return null;
  if (error.keyPattern?.barcode) return new Error("Ya existe un producto con ese código de barras");
  if (error.keyPattern?.sku) return new Error("Ya existe un producto con ese SKU");
  return new Error("Ya existe un producto con esos datos");
};

export default ProductsService;
