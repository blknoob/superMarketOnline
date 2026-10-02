/**
 * DAO DE CATEGORÍAS
 *
 * Acceso a la colección categories (árbol del catálogo).
 */

import Category from "./models/category.model.js";

class CategoriesDAO {
  findAll(filter = {}) {
    return Category.find(filter).sort({ order: 1, name: 1 }).lean();
  }

  findById(id) {
    return Category.findById(id).lean();
  }

  findBySlug(slug) {
    return Category.findOne({ slug }).lean();
  }

  // Todas las categorías debajo de una dada, en cualquier nivel
  findDescendants(id) {
    return Category.find({ "ancestors._id": id }).lean();
  }

  countChildren(id) {
    return Category.countDocuments({ parent: id });
  }

  count() {
    return Category.estimatedDocumentCount();
  }

  async create(data) {
    const category = await Category.create(data);
    return category.toObject();
  }

  update(id, data) {
    return Category.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  }

  delete(id) {
    return Category.findByIdAndDelete(id).lean();
  }
}

export default CategoriesDAO;
