/**
 * MODELO DE CATEGORÍAS - ÁRBOL DEL CATÁLOGO
 *
 * Las categorías forman un árbol de profundidad libre:
 * Alimentación → Lácteos → Quesos
 *
 * Cada categoría guarda su padre y la lista de ancestros (de la raíz
 * hacia abajo). Los ancestros permiten armar el breadcrumb y buscar
 * todos los productos de una rama sin consultas recursivas.
 *
 * Relaciones:
 * - parent / ancestors → categories
 * - Referenciada por products.category y products.categoryPath
 */

import mongoose from "mongoose";

const ancestorSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Identificador para URLs: "lacteos", "carnes-y-pollo"
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    // Ancestros desde la raíz hasta el padre directo
    ancestors: { type: [ancestorSchema], default: [] },
    // Posición dentro de sus hermanas (menor primero)
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

categorySchema.index({ parent: 1, order: 1 });
categorySchema.index({ "ancestors._id": 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;
