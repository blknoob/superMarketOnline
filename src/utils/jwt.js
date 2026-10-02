/**
 * UTILIDADES JWT - TOKENS DE AUTENTICACIÓN Y AUTORIZACIÓN
 * 
 * Módulo especializado en gestión de JSON Web Tokens (JWT)
 * Proporciona funciones para creación y verificación segura de tokens
 * 
 * CARACTERÍSTICAS DE SEGURIDAD:
 * - Utilización de secret key desde variables de entorno
 * - Tokens con expiración de 24 horas
 * - Verificación robusta con manejo de errores
 * - Compatibilidad con estándares JWT (RFC 7519)
 * 
 * FUNCIONALIDADES:
 * - Generación de tokens con payload personalizado
 * - Verificación y decodificación de tokens
 * - Manejo seguro de errores de verificación
 * - Integración con sistemas de autenticación
 * 
 * CASOS DE USO:
 * - Autenticación de usuarios tras login
 * - Autorización en endpoints protegidos
 * - Verificación de identidad en requests
 * - Tokens de sesión temporal
 * 
 * INTEGRACIÓN DEL SISTEMA:
 * - Middleware de autenticación
 * - Controllers de usuario (login/register)
 * - Guards de rutas protegidas
 * - Validación de permisos administrativos
 * 
 * CONFIGURACIÓN REQUERIDA:
 * - JWT_SECRET: Variable de entorno con clave secreta
 * - Clave debe ser suficientemente compleja
 * - Almacenamiento seguro de la clave secreta
 */
import jwt from "jsonwebtoken";

/**
 * GENERAR TOKEN JWT
 * 
 * Crea un JSON Web Token firmado con payload personalizado
 * Token válido por 24 horas desde su creación
 * 
 * @param {Object} payload - Datos a incluir en el token
 * @param {string} payload.id - ID único del usuario
 * @param {string} payload.email - Email del usuario
 * @param {string} payload.role - Rol del usuario (user, admin, premium)
 * @param {Object} payload.other - Otros datos relevantes para la sesión
 * @returns {string} Token JWT firmado listo para uso
 * 
 * ESTRUCTURA DEL TOKEN:
 * - Header: Algoritmo de firma (HS256 por defecto)
 * - Payload: Datos del usuario + metadata
 * - Signature: Firma generada con JWT_SECRET
 * 
 * CONFIGURACIÓN:
 * - expiresIn: '24h' (24 horas de validez)
 * - algorithm: HS256 (HMAC SHA-256)
 * - secret: process.env.JWT_SECRET
 * 
 * PAYLOAD TÍPICO:
 * {
 *   id: '507f1f77bcf86cd799439011',
 *   email: 'user@example.com',
 *   role: 'user',
 *   iat: 1641024000,  // issued at
 *   exp: 1641110400   // expiration
 * }
 * 
 * SEGURIDAD:
 * - Secret key debe mantenerse segura
 * - Token incluye timestamp de creación y expiración
 * - Firma previene modificación del payload
 * - Expiración automática para seguridad
 * 
 * CASOS DE USO:
 * - Login exitoso: generar token de sesión
 * - Registro: crear token para usuario nuevo
 * - Renovación: generar nuevo token antes de expiración
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
};

/**
 * VERIFICAR Y DECODIFICAR TOKEN JWT
 * 
 * Valida un token JWT y retorna el payload decodificado
 * Maneja errores de verificación de forma segura
 * 
 * @param {string} token - Token JWT a verificar
 * @returns {Object|null} Payload decodificado si válido, null si inválido
 * 
 * PROCESO DE VERIFICACIÓN:
 * 1. Verificar formato del token (3 partes separadas por puntos)
 * 2. Decodificar header y validar algoritmo
 * 3. Verificar firma usando JWT_SECRET
 * 4. Validar timestamps (iat, exp)
 * 5. Retornar payload si todo es válido
 * 
 * CASOS DE ERROR MANEJADOS:
 * - Token malformado (formato incorrecto)
 * - Firma inválida (modificación detectada)
 * - Token expirado (más de 24h)
 * - Secret incorrecto
 * - Token nulo o undefined
 * 
 * RESPUESTA EXITOSA:
 * {
 *   id: '507f1f77bcf86cd799439011',
 *   email: 'user@example.com',
 *   role: 'user',
 *   iat: 1641024000,  // timestamp de creación
 *   exp: 1641110400   // timestamp de expiración
 * }
 * 
 * RESPUESTA DE ERROR:
 * null - Cualquier error en verificación
 * 
 * SEGURIDAD:
 * - Verificación completa de integridad
 * - Validación automática de expiración
 * - Manejo seguro de errores (no exposición de detalles)
 * - Retorno consistente (payload o null)
 * 
 * CASOS DE USO:
 * - Middleware de autenticación: validar token en headers
 * - Rutas protegidas: verificar permisos de acceso
 * - Renovación: verificar token antes de renovar
 * - Logout: validar token antes de invalidar
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};
