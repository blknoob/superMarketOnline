/**
 * @fileoverview Configuración y conexión a base de datos MongoDB
 * 
 * Este módulo maneja la conexión persistente a MongoDB utilizando Mongoose.
 * Implementa:
 * - Configuración centralizada de conexión
 * - Manejo robusto de errores
 * - Variables de entorno para flexibilidad
 * - Logging de estado de conexión
 * - Terminación controlada en caso de fallo
 * 
 * SEGURIDAD:
 * - URI de conexión desde variables de entorno
 * - No exposición de credenciales en código
 * - Manejo seguro de errores de conexión
 * - Terminación controlada para prevenir estados inconsistentes
 * 
 * DEPENDENCIAS:
 * - mongoose: ODM para MongoDB
 * - dotenv: Gestión de variables de entorno
 * 
 * @author Sistema SuperMercado Online
 * @version 1.0.0
 * @since 2026-01-02
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Establece conexión con la base de datos MongoDB
 * 
 * Configura la conexión utilizando la URI definida en variables de entorno.
 * En caso de fallo, registra el error y termina el proceso para evitar
 * estados inconsistentes de la aplicación.
 * 
 * CARACTERÍSTICAS:
 * - Conexión asíncrona no bloqueante
 * - Logging detallado de estado
 * - Terminación controlada en caso de error
 * - Validación automática de URI
 * 
 * VARIABLES DE ENTORNO REQUERIDAS:
 * - MONGO_URI: URI completa de conexión a MongoDB
 * 
 * CASOS DE USO:
 * - Inicialización de la aplicación
 * - Reconexión después de fallo temporal
 * - Setup de ambiente de testing
 * - Configuración de contenedores Docker
 * 
 * @async
 * @function connectDB
 * @returns {Promise<void>} Promise que se resuelve cuando la conexión es exitosa
 * @throws {Error} En caso de fallo de conexión, termina el proceso con exit(1)
 */

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conexión a MongoDB");
  } catch (error) {
    console.error("Fallo la conexión a MongoDB:", error.message);
    process.exit(1);
  }
};