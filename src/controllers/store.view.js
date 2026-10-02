/**
 * CONTROLADOR DE VISTAS DE LA TIENDA
 *
 * Páginas del cliente: catálogo, carrito, checkout, pedidos y pago.
 * Los errores de negocio (sin stock, dirección incompleta...) se
 * muestran en la misma página con un mensaje, sin perder la navegación.
 */

import ProductsService from "../services/products.service.js";
import CartsService from "../services/carts.service.js";
import OrdersService, { STATUS_LABELS } from "../services/orders.service.js";
import PaymentsService, { METHOD_LABELS } from "../services/payments.service.js";
import UsersService from "../services/users.service.js";
import SettingsService from "../services/settings.service.js";

const productsService = new ProductsService();
const cartsService = new CartsService();
const ordersService = new OrdersService();
const paymentsService = new PaymentsService();
const usersService = new UsersService();
const settingsService = new SettingsService();

// Pasa un mensaje a la siguiente página por query string (?msg=...&type=...)
const redirectWithMessage = (res, url, message, type = "error") => {
  const sep = url.includes("?") ? "&" : "?";
  res.redirect(`${url}${sep}msg=${encodeURIComponent(message)}&type=${type}`);
};

// Ruta interna de la página anterior (sin dominio ni mensajes previos), para volver tras una acción
const backPath = (req) => {
  try {
    const url = new URL(req.get("Referer"));
    url.searchParams.delete("msg");
    url.searchParams.delete("type");
    return url.pathname + url.search;
  } catch {
    return "/";
  }
};

// Busca una categoría por slug dentro del árbol anidado
const findNode = (nodes = [], slug) => {
  if (!slug) return null;
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const found = findNode(node.children, slug);
    if (found) return found;
  }
  return null;
};

const withStatusLabel = (order) => ({ ...order, statusLabel: STATUS_LABELS[order.status] });

class StoreViewController {
  /**
   * GET / — Catálogo con filtro por categoría (?category=slug), búsqueda (?q=) y páginas (?page=)
   */
  async home(req, res, next) {
    try {
      const { category: categorySlug, q, page } = req.query;
      const result = await productsService.list({ categorySlug, search: q, page });
      const breadcrumb = result.category ? [...result.category.ancestors, result.category] : [];
      res.render("index", {
        ...result,
        breadcrumb,
        activeRootSlug: breadcrumb[0]?.slug || null,
        subcategories: findNode(res.locals.categoryTree, categorySlug)?.children || [],
        currentCategorySlug: categorySlug || null,
        search: q || "",
        prevPage: result.page > 1 ? result.page - 1 : null,
        nextPage: result.page < result.pages ? result.page + 1 : null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /cart
   */
  async cart(req, res, next) {
    try {
      const cart = await cartsService.getCart(req.user._id);
      res.render("users/cart", { cart });
    } catch (error) {
      next(error);
    }
  }

  async addToCart(req, res) {
    const back = backPath(req);
    try {
      await cartsService.addProduct(req.user._id, req.body.productId, req.body.quantity || 1);
      redirectWithMessage(res, back, "Producto agregado al carrito", "success");
    } catch (error) {
      redirectWithMessage(res, back, error.message);
    }
  }

  async updateCartItem(req, res) {
    try {
      await cartsService.updateQuantity(req.user._id, req.body.productId, req.body.quantity);
      res.redirect("/cart");
    } catch (error) {
      redirectWithMessage(res, "/cart", error.message);
    }
  }

  async removeFromCart(req, res) {
    try {
      await cartsService.removeProduct(req.user._id, req.body.productId);
      res.redirect("/cart");
    } catch (error) {
      redirectWithMessage(res, "/cart", error.message);
    }
  }

  async clearCart(req, res) {
    try {
      await cartsService.clear(req.user._id);
      res.redirect("/cart");
    } catch (error) {
      redirectWithMessage(res, "/cart", error.message);
    }
  }

  /**
   * GET /checkout — Resumen del carrito y elección de dirección
   */
  async checkout(req, res, next) {
    try {
      const cart = await cartsService.getCart(req.user._id);
      if (cart.isEmpty) return redirectWithMessage(res, "/cart", "Tu carrito está vacío");
      if (cart.hasUnavailable) {
        return redirectWithMessage(res, "/cart", "Hay productos sin stock suficiente; ajusta las cantidades");
      }
      const addresses = await usersService.getAddresses(req.user._id);
      const shippingCostRef = await settingsService.getShippingCostRef();
      res.render("checkout/checkout", { cart, addresses, shippingCostRef });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /checkout — Crea la orden con una dirección guardada o una nueva
   */
  async placeOrder(req, res) {
    try {
      const { addressId, ...newAddress } = req.body;
      const address =
        addressId && addressId !== "new"
          ? await usersService.getAddress(req.user._id, addressId)
          : await usersService.addAddress(req.user._id, newAddress);
      if (!address) throw new Error("Dirección no encontrada");

      const order = await ordersService.createFromCart(req.user._id, address);
      res.redirect(`/orders/${order._id}`);
    } catch (error) {
      redirectWithMessage(res, "/checkout", error.message);
    }
  }

  /**
   * GET /orders — Pedidos del usuario
   */
  async orders(req, res, next) {
    try {
      const orders = await ordersService.getForUser(req.user._id);
      res.render("users/orders", { orders: orders.map(withStatusLabel) });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /orders/:id — Detalle del pedido; si espera pago, muestra el formulario
   */
  async orderDetail(req, res, next) {
    try {
      const order = await ordersService.getForUserById(req.user._id, req.params.id);
      if (!order) {
        return res.status(404).render("error", { title: "Pedido no encontrado", message: "El pedido no existe." });
      }
      const payments = await paymentsService.getForOrder(order._id);
      res.render("users/orderDetail", {
        order: withStatusLabel(order),
        payments: payments.map((p) => ({ ...p, methodLabel: METHOD_LABELS[p.method] })),
        awaitingPayment: order.status === "pending_payment",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /orders/:id/payments — El cliente reporta un pago
   */
  async reportPayment(req, res) {
    const url = `/orders/${req.params.id}`;
    try {
      await paymentsService.report(req.user._id, req.params.id, {
        ...req.body,
        proofUrl: req.file ? `/comprobantes/${req.file.filename}` : null,
      });
      redirectWithMessage(res, url, "Pago reportado. Te avisaremos cuando lo verifiquemos.", "success");
    } catch (error) {
      redirectWithMessage(res, url, error.message);
    }
  }

  /**
   * GET /current — Perfil con direcciones guardadas
   */
  async profile(req, res, next) {
    try {
      const addresses = await usersService.getAddresses(req.user._id);
      res.render("users/current", { profile: res.locals.user, addresses });
    } catch (error) {
      next(error);
    }
  }

  async addAddress(req, res) {
    try {
      await usersService.addAddress(req.user._id, req.body);
      redirectWithMessage(res, "/current", "Dirección guardada", "success");
    } catch (error) {
      redirectWithMessage(res, "/current", error.message);
    }
  }
}

export default StoreViewController;
