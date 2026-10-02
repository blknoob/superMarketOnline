/**
 * SERVICIO DE CARRITOS
 *
 * El carrito guarda solo producto y cantidad. Al leerlo se calculan
 * precios con la tasa vigente y se marcan los productos que ya no
 * están disponibles (borrados, inactivos o sin stock suficiente).
 */

import CartsRepository from "../repositories/carts.repository.js";
import ProductsRepository from "../repositories/products.repository.js";
import SettingsService from "./settings.service.js";
import { round2, toBs } from "../utils/money.js";

const MAX_QUANTITY = 100;

class CartsService {
  constructor() {
    this.repository = new CartsRepository();
    this.productsRepository = new ProductsRepository();
    this.settingsService = new SettingsService();
  }

  /**
   * Carrito con precios y totales calculados.
   *
   * @returns {Promise<{items, subtotal, subtotalRef, exchangeRate, hasUnavailable, isEmpty}>}
   */
  async getCart(userId) {
    const cart = await this.repository.findOrCreateByUser(userId);
    const exchangeRate = await this.settingsService.getExchangeRate();

    // Un producto borrado queda como null después del populate
    const items = cart.items
      .filter((item) => item.product)
      .map((item) => {
        const product = item.product;
        const price = toBs(product.priceRef, exchangeRate);
        return {
          product: { ...product, image: product.images?.[0] || null },
          quantity: item.quantity,
          price,
          subtotal: price === null ? null : round2(price * item.quantity),
          subtotalRef: round2(product.priceRef * item.quantity),
          available: product.isActive && product.stock >= item.quantity,
        };
      });

    const subtotalRef = round2(items.reduce((sum, i) => sum + i.subtotalRef, 0));
    return {
      items,
      subtotalRef,
      subtotal: toBs(subtotalRef, exchangeRate),
      exchangeRate,
      hasUnavailable: items.some((i) => !i.available),
      isEmpty: items.length === 0,
    };
  }

  async addProduct(userId, productId, quantity = 1) {
    quantity = Number(quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new Error(`La cantidad debe estar entre 1 y ${MAX_QUANTITY}`);
    }
    const product = await this.productsRepository.findById(productId);
    if (!product || !product.isActive) throw new Error("Producto no disponible");

    const cart = await this.repository.findOrCreateByUser(userId);
    const inCart = cart.items.find((i) => i.product && String(i.product._id) === String(productId));
    const total = (inCart ? inCart.quantity : 0) + quantity;
    if (total > product.stock) {
      throw new Error(`Solo hay ${product.stock} unidades disponibles de ${product.name}`);
    }
    return this.repository.addItem(userId, productId, quantity);
  }

  /**
   * Cambia la cantidad de un producto. Con 0 lo quita del carrito.
   */
  async updateQuantity(userId, productId, quantity) {
    quantity = Number(quantity);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QUANTITY) {
      throw new Error(`La cantidad debe estar entre 0 y ${MAX_QUANTITY}`);
    }
    if (quantity === 0) return this.removeProduct(userId, productId);

    const product = await this.productsRepository.findById(productId);
    if (!product || !product.isActive) throw new Error("Producto no disponible");
    if (quantity > product.stock) {
      throw new Error(`Solo hay ${product.stock} unidades disponibles de ${product.name}`);
    }
    return this.repository.setItemQuantity(userId, productId, quantity);
  }

  removeProduct(userId, productId) {
    return this.repository.removeItem(userId, productId);
  }

  clear(userId) {
    return this.repository.clear(userId);
  }
}

export default CartsService;
