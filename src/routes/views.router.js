/**
 * ROUTER DE VISTAS WEB
 *
 * Páginas renderizadas con Handlebars:
 * - Públicas: catálogo, login, registro, recuperación de contraseña
 * - Cliente: perfil, carrito, checkout, pedidos y pago
 * - Admin: panel, productos, categorías, pedidos, usuarios
 *
 * Todas las vistas reciben el árbol de categorías (menú) y el usuario
 * en sesión (navbar) en res.locals.
 */

import { Router } from "express";
import multer from "multer";
import {
  authenticatePassport,
  requireAdmin,
  redirectPassport,
  userInSesion,
} from "../middlewares/passport.middleware.js";
import { createPaymentProofUpload, createSecureStorage, validateFile, handleMulterError } from "../middlewares/upload.middleware.js";
import StoreViewController from "../controllers/store.view.js";
import AdminViewController from "../controllers/admin.view.js";
import CategoriesService from "../services/categories.service.js";

const router = Router();
const store = new StoreViewController();
const admin = new AdminViewController();
const categoriesService = new CategoriesService();

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const productImageUpload = multer({
  storage: createSecureStorage("public/images/"),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
    const error = new Error("Solo se permiten imágenes (JPEG, PNG, GIF, WebP)");
    error.code = "INVALID_FILE_TYPE";
    cb(error, false);
  },
});
const paymentProofUpload = createPaymentProofUpload();

// Datos comunes a todas las vistas: menú de categorías y mensaje flash (?msg=)
router.use(async (req, res, next) => {
  try {
    res.locals.categoryTree = await categoriesService.getTree();
    if (req.query.msg) {
      res.locals.flash = { message: req.query.msg, type: req.query.type === "success" ? "success" : "danger" };
    }
    next();
  } catch (error) {
    next(error);
  }
});

const customer = [authenticatePassport, userInSesion];
const adminOnly = [authenticatePassport, requireAdmin, userInSesion];

/* ---------- Públicas ---------- */

router.get("/", userInSesion, store.home);
router.get("/login", redirectPassport, (req, res) => res.render("auth/login"));
router.get("/register", redirectPassport, (req, res) => res.render("auth/register"));
router.get("/logout", (req, res) => {
  res.clearCookie("access_token");
  res.redirect("/");
});
router.get("/forgot-password", (req, res) => res.render("auth/forgotPassword"));
router.get("/reset-password", (req, res) => res.render("auth/resetPassword", { token: req.query.token }));

/* ---------- Cliente ---------- */

router.get("/current", customer, store.profile);
router.post("/current/addresses", customer, store.addAddress);

router.get("/cart", customer, store.cart);
router.post("/cart/add", customer, store.addToCart);
router.post("/cart/update", customer, store.updateCartItem);
router.post("/cart/remove", customer, store.removeFromCart);
router.post("/cart/clear", customer, store.clearCart);

router.get("/checkout", customer, store.checkout);
router.post("/checkout", customer, store.placeOrder);

router.get("/orders", customer, store.orders);
router.get("/orders/:id", customer, store.orderDetail);
router.post(
  "/orders/:id/payments",
  customer,
  paymentProofUpload.single("proof"),
  validateFile({ required: false, allowedMimeTypes: IMAGE_TYPES, maxFileSize: MAX_IMAGE_SIZE }),
  store.reportPayment
);

/* ---------- Administración ---------- */

router.get("/admin/panel", adminOnly, admin.panel);
router.post("/admin/settings", adminOnly, admin.updateSettings);

router.get("/admin/products", adminOnly, admin.products);
router.post(
  "/admin/products",
  adminOnly,
  productImageUpload.single("image"),
  validateFile({ required: false, allowedMimeTypes: IMAGE_TYPES, maxFileSize: MAX_IMAGE_SIZE }),
  admin.createProduct
);
router.get("/admin/products/:id/edit", adminOnly, admin.editProduct);
router.post(
  "/admin/products/:id/edit",
  adminOnly,
  productImageUpload.single("image"),
  validateFile({ required: false, allowedMimeTypes: IMAGE_TYPES, maxFileSize: MAX_IMAGE_SIZE }),
  admin.updateProduct
);
router.post("/admin/products/:id/delete", adminOnly, admin.deleteProduct);

router.get("/admin/categories", adminOnly, admin.categories);
router.post("/admin/categories", adminOnly, admin.createCategory);
router.post("/admin/categories/:id", adminOnly, admin.updateCategory);
router.post("/admin/categories/:id/delete", adminOnly, admin.deleteCategory);

router.get("/admin/orders", adminOnly, admin.orders);
router.get("/admin/orders/:id", adminOnly, admin.orderDetail);
router.post("/admin/orders/:id/status", adminOnly, admin.changeOrderStatus);
router.post("/admin/payments/:id/review", adminOnly, admin.reviewPayment);

router.get("/admin/users", adminOnly, admin.users);
router.post("/admin/users/:id/role", adminOnly, admin.updateUserRole);

router.use(handleMulterError);

export default router;
