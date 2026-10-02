/**
 * MODELO DE MARCAS
 *
 * Marcas de los productos (Nestlé, Polar, Colgate...). Se crean
 * automáticamente al cargar un producto con una marca nueva.
 *
 * Relaciones:
 * - Referenciada por products.brand
 */

import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
