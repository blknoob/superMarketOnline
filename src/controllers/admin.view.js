/**
 * CONTROLADOR DE VISTAS DEL PANEL DE ADMINISTRACIÓN
 *
 * Productos, categorías, pedidos, pagos, usuarios y configuración
 * (tasa EUR y costo de envío).
 */

import ProductsService from "../services/products.service.js";
import CategoriesService from "../services/categories.service.js";
import BrandsService from "../services/brands.service.js";
import OrdersService, { STATUS_LABELS } from "../services/orders.service.js";
import PaymentsService, { METHOD_LABELS } from "../services/payments.service.js";
import SettingsService from "../services/settings.service.js";
import UsersService from "../services/users.service.js";
import { PRODUCT_UNITS } from "../repositories/daos/mongo/models/products.model.js";

const productsService = new ProductsService();
const categoriesService = new CategoriesService();
const brandsService = new BrandsService();
const ordersService = new OrdersService();
const paymentsService = new PaymentsService();
const settingsService = new SettingsService();
const usersService = new UsersService();

const redirectWithMessage = (res, url, message, type = "error") => {
  const sep = url.includes("?") ? "&" : "?";
  res.redirect(`${url}${sep}msg=${encodeURIComponent(message)}&type=${type}`);
};

// Datos del formulario de producto, con la imagen subida si la hay
const productFormData = (req) => ({
  ...req.body,
  isActive: req.body.isActive === "on",
  ...(req.file ? { images: [`/images/${req.file.filename}`] } : {}),
});

// Estados que el admin elige a mano. "Pago en revisión", "Pagada" y "volver
// a pendiente" los fija el flujo de pagos (reporte y revisión del pago).
const manualTransitions = (status) =>
  ordersService
    .allowedTransitions(status)
    .filter((s) => s !== "payment_review" && !(status === "payment_review" && s !== "canceled"));

class AdminViewController {
  /**
   * GET /admin/panel — Resumen y configuración de precios
   */
  async panel(req, res, next) {
    try {
      const rateInfo = await settingsService.getExchangeRateInfo();
      const shippingCostRef = await settingsService.getShippingCostRef();
      const pendingPayments = await paymentsService.list({ status: "pending" });
      res.render("admin/adminPanel", {
        rate: rateInfo.rate,
        rateUpdatedAt: rateInfo.updatedAt,
        shippingCostRef,
        pendingPaymentsCount: pendingPayments.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res) {
    try {
      await settingsService.setExchangeRate(req.body.eurRate);
      await settingsService.setShippingCostRef(req.body.shippingCostRef || 0);
      redirectWithMessage(res, "/admin/panel", "Configuración guardada", "success");
    } catch (error) {
      redirectWithMessage(res, "/admin/panel", error.message);
    }
  }

  /**
   * GET /admin/products — Listado y alta de productos
   */
  async products(req, res, next) {
    try {
      const { category, q } = req.query;
      const result = await productsService.list({ categorySlug: category, search: q, includeInactive: true, limit: 0 });
      res.render("admin/updateProducts", {
        ...result,
        categories: await categoriesService.getFlatList(),
        brands: await brandsService.getAll(),
        units: PRODUCT_UNITS,
        currentCategorySlug: category || "",
        search: q || "",
      });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res) {
    try {
      await productsService.create(productFormData(req));
      redirectWithMessage(res, "/admin/products", "Producto creado", "success");
    } catch (error) {
      redirectWithMessage(res, "/admin/products", error.message);
    }
  }

  async editProduct(req, res, next) {
    try {
      const product = await productsService.getById(req.params.id);
      if (!product) {
        return res.status(404).render("error", { title: "Producto no encontrado", message: "El producto no existe." });
      }
      res.render("admin/editProduct", {
        product,
        categories: await categoriesService.getFlatList(),
        brands: await brandsService.getAll(),
        units: PRODUCT_UNITS,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res) {
    try {
      await productsService.update(req.params.id, productFormData(req));
      redirectWithMessage(res, "/admin/products", "Producto actualizado", "success");
    } catch (error) {
      redirectWithMessage(res, `/admin/products/${req.params.id}/edit`, error.message);
    }
  }

  async deleteProduct(req, res) {
    try {
      await productsService.delete(req.params.id);
      redirectWithMessage(res, "/admin/products", "Producto eliminado", "success");
    } catch (error) {
      redirectWithMessage(res, "/admin/products", error.message);
    }
  }

  /**
   * GET /admin/categories — Árbol de categorías
   */
  async categories(req, res, next) {
    try {
      res.render("admin/categories", { categories: await categoriesService.getFlatList() });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res) {
    try {
      await categoriesService.create({ name: req.body.name, parentId: req.body.parentId, order: req.body.order });
      redirectWithMessage(res, "/admin/categories", "Categoría creada", "success");
    } catch (error) {
      redirectWithMessage(res, "/admin/categories", error.message);
    }
  }

  async updateCategory(req, res) {
    try {
      await categoriesService.update(req.params.id, {
        name: req.body.name,
        parentId: req.body.parentId,
        order: req.body.order,
        isActive: req.body.isActive === "on",
      });
      redirectWithMessage(res, "/admin/categories", "Categoría actualizada", "success");
    } catch (error) {
      redirectWithMessage(res, "/admin/categories", error.message);
    }
  }

  async deleteCategory(req, res) {
    try {
      await categoriesService.delete(req.params.id);
      redirectWithMessage(res, "/admin/categories", "Categoría eliminada", "success");
    } catch (error) {
      redirectWithMessage(res, "/admin/categories", error.message);
    }
  }

  /**
   * GET /admin/orders — Pedidos, filtrables por estado
   */
  async orders(req, res, next) {
    try {
      const status = STATUS_LABELS[req.query.status] ? req.query.status : null;
      const orders = await ordersService.list({ status });
      res.render("admin/orders", {
        orders: orders.map((o) => ({ ...o, statusLabel: STATUS_LABELS[o.status] })),
        statuses: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label, selected: value === status })),
      });
    } catch (error) {
      next(error);
    }
  }

  async orderDetail(req, res, next) {
    try {
      const order = await ordersService.getById(req.params.id);
      if (!order) {
        return res.status(404).render("error", { title: "Pedido no encontrado", message: "El pedido no existe." });
      }
      const payments = await paymentsService.getForOrder(order._id);
      res.render("admin/orderDetail", {
        order: {
          ...order,
          statusLabel: STATUS_LABELS[order.status],
          statusHistory: order.statusHistory.map((h) => ({ ...h, label: STATUS_LABELS[h.status] })),
        },
        payments: payments.map((p) => ({ ...p, methodLabel: METHOD_LABELS[p.method] })),
        transitions: manualTransitions(order.status).map((value) => ({ value, label: STATUS_LABELS[value] })),
        customer: await usersService
          .getById(order.user)
          .then((user) => (user?.toObject ? user.toObject() : user))
          .catch(() => null),
      });
    } catch (error) {
      next(error);
    }
  }

  async changeOrderStatus(req, res) {
    const url = `/admin/orders/${req.params.id}`;
    try {
      await ordersService.changeStatus(req.params.id, req.body.status, req.body.note || "");
      redirectWithMessage(res, url, "Estado actualizado", "success");
    } catch (error) {
      redirectWithMessage(res, url, error.message);
    }
  }

  async reviewPayment(req, res) {
    const url = req.body.orderId ? `/admin/orders/${req.body.orderId}` : "/admin/orders";
    try {
      const approve = req.body.decision === "approve";
      await paymentsService.review(req.params.id, req.user._id, approve);
      redirectWithMessage(res, url, approve ? "Pago aprobado" : "Pago rechazado", "success");
    } catch (error) {
      redirectWithMessage(res, url, error.message);
    }
  }

  /**
   * GET /admin/users — Usuarios y roles
   */
  async users(req, res, next) {
    try {
      const users = await usersService.getAll();
      res.render("admin/updateUsers", { users: users.map((u) => (u.toObject ? u.toObject() : u)) });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req, res) {
    try {
      await usersService.updateUser(req.params.id, { role: req.body.role });
      res.redirect("/admin/users");
    } catch (error) {
      redirectWithMessage(res, "/admin/users", error.message);
    }
  }
}

export default AdminViewController;
