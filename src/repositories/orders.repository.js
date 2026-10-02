/**
 * REPOSITORY DE ÓRDENES
 * 
 * Capa entre los services y la persistencia. Hoy expone el DAO de
 * MongoDB tal cual; si se cambia de base de datos, se cambia aquí
 * sin tocar los services.
 */

import OrdersDAO from "./daos/mongo/orders.dao.js";

class OrdersRepository extends OrdersDAO {}

export default OrdersRepository;
