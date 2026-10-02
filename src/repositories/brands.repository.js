/**
 * REPOSITORY DE MARCAS
 * 
 * Capa entre los services y la persistencia. Hoy expone el DAO de
 * MongoDB tal cual; si se cambia de base de datos, se cambia aquí
 * sin tocar los services.
 */

import BrandsDAO from "./daos/mongo/brands.dao.js";

class BrandsRepository extends BrandsDAO {}

export default BrandsRepository;
