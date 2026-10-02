/**
 * ROUTER API DE ÓRDENES - /api/orders
 * Pedidos del usuario autenticado.
 */

import { Router } from "express";
import OrdersController from "../controllers/orders.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
const orders = new OrdersController();

router.use(authenticate);
router.get("/", orders.list);
router.get("/:id", orders.getById);
router.post("/", orders.create);

export default router;
