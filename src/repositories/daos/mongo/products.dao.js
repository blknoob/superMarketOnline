/**
 * DAO DE PRODUCTOS - CATÁLOGO DEL SUPERMERCADO
 *
 * Acceso a la colección products. Las lecturas devuelven objetos
 * planos (lean) con marca y categoría ya pobladas.
 *
 * El stock se descuenta con una sola operación atómica que verifica
 * que alcance, así dos compras simultáneas no pueden dejarlo negativo.
 */

import Product from "./models/products.model.js";

const POPULATE = [
  { path: "brand", select: "name slug" },
  { path: "category", select: "name slug ancestors" },
];

class ProductsDAO {
  find(filter = {}, { sort = { createdAt: -1 }, skip = 0, limit = 0 } = {}) {
    return Product.find(filter).sort(sort).skip(skip).limit(limit).populate(POPULATE).lean();
  }

  count(filter = {}) {
    return Product.countDocuments(filter);
  }

  findById(id) {
    return Product.findById(id).populate(POPULATE).lean();
  }

  findByIds(ids, { session } = {}) {
    return Product.find({ _id: { $in: ids } }).session(session || null).lean();
  }

  findBySku(sku) {
    return Product.findOne({ sku: sku.toUpperCase() }).lean();
  }

  findBySlug(slug) {
    return Product.findOne({ slug }).populate(POPULATE).lean();
  }

  async create(data) {
    const product = await Product.create(data);
    return product.toObject();
  }

  update(id, data) {
    return Product.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  }

  updateMany(filter, update) {
    return Product.updateMany(filter, update);
  }

  delete(id) {
    return Product.findByIdAndDelete(id).lean();
  }

  /**
   * Descuenta stock solo si alcanza. Devuelve null si no había suficiente.
   */
  decrementStock(id, quantity, { session } = {}) {
    return Product.findOneAndUpdate(
      { _id: id, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true, session }
    ).lean();
  }

  incrementStock(id, quantity, { session } = {}) {
    return Product.findByIdAndUpdate(id, { $inc: { stock: quantity } }, { new: true, session }).lean();
  }
}

export default ProductsDAO;
