/**
 * DAO DE CARRITOS
 *
 * Un carrito por usuario. Las operaciones sobre ítems son atómicas
 * ($inc / $pull / $set) para no pisar cambios hechos en paralelo.
 */

import Cart from "./models/carts.model.js";

const POPULATE = {
  path: "items.product",
  select: "name slug sku unit unitSize priceRef stock images isActive",
};

class CartsDAO {
  findByUser(userId) {
    return Cart.findOne({ user: userId }).populate(POPULATE).lean();
  }

  // Devuelve el carrito del usuario, creándolo si no existe
  findOrCreateByUser(userId) {
    return Cart.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId, items: [] } },
      { new: true, upsert: true }
    )
      .populate(POPULATE)
      .lean();
  }

  async addItem(userId, productId, quantity) {
    const increased = await Cart.findOneAndUpdate(
      { user: userId, "items.product": productId },
      { $inc: { "items.$.quantity": quantity } },
      { new: true }
    );
    if (increased) return increased;
    return Cart.findOneAndUpdate(
      { user: userId },
      { $push: { items: { product: productId, quantity } } },
      { new: true, upsert: true }
    );
  }

  setItemQuantity(userId, productId, quantity) {
    return Cart.findOneAndUpdate(
      { user: userId, "items.product": productId },
      { $set: { "items.$.quantity": quantity } },
      { new: true }
    );
  }

  removeItem(userId, productId) {
    return Cart.findOneAndUpdate(
      { user: userId },
      { $pull: { items: { product: productId } } },
      { new: true }
    );
  }

  clear(userId, { session } = {}) {
    return Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } }, { new: true, session });
  }
}

export default CartsDAO;
