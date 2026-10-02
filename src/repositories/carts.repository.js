/**
 * REPOSITORY DE CARRITOS
 * 
 * Capa entre los services y la persistencia. Hoy expone el DAO de
 * MongoDB tal cual; si se cambia de base de datos, se cambia aquí
 * sin tocar los services.
 */

import CartsDAO from "./daos/mongo/carts.dao.js";

class CartsRepository extends CartsDAO {}

export default CartsRepository;
