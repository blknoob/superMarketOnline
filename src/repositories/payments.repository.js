/**
 * REPOSITORY DE PAGOS
 * 
 * Capa entre los services y la persistencia. Hoy expone el DAO de
 * MongoDB tal cual; si se cambia de base de datos, se cambia aquí
 * sin tocar los services.
 */

import PaymentsDAO from "./daos/mongo/payments.dao.js";

class PaymentsRepository extends PaymentsDAO {}

export default PaymentsRepository;
