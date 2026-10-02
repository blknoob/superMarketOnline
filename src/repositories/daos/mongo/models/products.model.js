/**
 * MODELO DE PRODUCTOS - CATÁLOGO DEL SUPERMERCADO
 *
 * Cada presentación es un producto propio: "Leche Entera 1L" y
 * "Leche Entera 2L" son dos productos con su SKU y su stock.
 *
 * PRECIOS:
 * - priceRef es el precio de referencia en EUR (lo único que se guarda)
 * - El precio en Bs se calcula al mostrarlo: priceRef × tasa EUR vigente
 * - Las órdenes guardan la tasa y los precios del momento de la compra
 *
 * CATEGORÍAS:
 * - category: la categoría donde está el producto (cualquier nivel)
 * - categoryPath: esa categoría más todos sus ancestros, para que el
 *   producto aparezca al filtrar por cualquier nivel de la rama
 *
 * Relaciones:
 * - brand → brands
 * - category / categoryPath → categories
 * - Referenciado por carts.items.product y orders.items.product
 */

import mongoose from "mongoose";

export const PRODUCT_UNITS = ["und", "kg", "g", "L", "ml"];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "", trim: true },
    // Código interno del supermercado
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    // Código de barras (EAN/UPC), opcional pero único si existe
    barcode: { type: String, trim: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    categoryPath: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    // Presentación: 1 L, 500 g, 12 und...
    unit: { type: String, enum: PRODUCT_UNITS, default: "und" },
    unitSize: { type: Number, default: 1, min: 0 },
    // Precio de referencia en EUR
    priceRef: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    // Rutas públicas de las imágenes; la primera es la principal
    images: { type: [String], default: [] },
    // Un producto inactivo no se muestra en la tienda pero se conserva
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

productSchema.index({ barcode: 1 }, { unique: true, partialFilterExpression: { barcode: { $type: "string" } } });
productSchema.index({ categoryPath: 1, isActive: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ name: "text", description: "text" }, { default_language: "spanish" });

const Product = mongoose.model("Product", productSchema);

export default Product;
