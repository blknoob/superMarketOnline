/**
 * UTILIDADES DE HASH DE CONTRASEÑAS - SEGURIDAD CRIPTOGRÁFICA
 * 
 * Módulo especializado en hashing seguro de contraseñas
 * Implementa bcrypt con salt rounds optimizados para seguridad
 * 
 * CARACTERÍSTICAS DE SEGURIDAD:
 * - Algoritmo bcrypt con salt automático
 * - Salt rounds: 10 (equilibrio seguridad/performance)
 * - Protección contra ataques de fuerza bruta
 * - Hashes únicos incluso para contraseñas idénticas
 * 
 * FUNCIONALIDADES:
 * - Creación de hash de contraseña
 * - Validación de contraseña contra hash
 * - Operaciones síncronas para simplicidad
 * - Manejo seguro de strings sensibles
 * 
 * CASOS DE USO:
 * - Registro de nuevos usuarios
 * - Validación de login
 * - Cambio de contraseñas
 * - Sistemas de autenticación
 * 
 * INTEGRACIÓN:
 * - UsersService para autenticación
 * - Middleware de registro y login
 * - APIs de gestión de usuarios
 * 
 * SEGURIDAD IMPLEMENTADA:
 * - Salt automático por bcrypt
 * - Costo computacional ajustable
 * - Resistencia a rainbow tables
 * - No almacenamiento de contraseñas planas
 */
import bcrypt from "bcrypt";

/**
 * CREAR HASH DE CONTRASEÑA
 * 
 * Genera un hash seguro de una contraseña utilizando bcrypt
 * Aplica salt automático con 10 rounds para balance seguridad/performance
 * 
 * @param {string} password - Contraseña en texto plano a hashear
 * @returns {string} Hash bcrypt de la contraseña con salt incluido
 * 
 * PROCESO:
 * 1. bcrypt genera salt aleatorio único
 * 2. Combina salt con contraseña
 * 3. Aplica 10 rounds de hashing
 * 4. Retorna hash que incluye salt y configuración
 * 
 * CARACTERÍSTICAS:
 * - Salt rounds: 10 (2^10 = 1024 iteraciones)
 * - Salt automático y único por hash
 * - Operación síncrona para simplicidad
 * - Hash self-contained con metadata
 * 
 * SEGURIDAD:
 * - Hashes únicos incluso para contraseñas idénticas
 * - Resistente a ataques de diccionario
 * - Protección contra rainbow tables
 * - Costo computacional ajustado para 2026
 * 
 * USO TÍPICO:
 * - Registro de usuarios: hash antes de guardar en DB
 * - Cambio de contraseña: hash nueva contraseña
 * - Reset de contraseña: hash contraseña temporal
 */
export const createHash = (password) => {
  return bcrypt.hashSync(password, 10);
};

/**
 * VALIDAR CONTRASEÑA CONTRA HASH
 * 
 * Verifica si una contraseña en texto plano coincide con un hash bcrypt
 * Utiliza el salt y configuración embebidos en el hash
 * 
 * @param {string} password - Contraseña en texto plano a verificar
 * @param {string} hash - Hash bcrypt almacenado (incluye salt y config)
 * @returns {boolean} true si la contraseña coincide, false en caso contrario
 * 
 * PROCESO:
 * 1. bcrypt extrae salt y config del hash almacenado
 * 2. Aplica mismo proceso de hash a contraseña de entrada
 * 3. Compara resultado con hash almacenado
 * 4. Retorna true si coinciden exactamente
 * 
 * CARACTERÍSTICAS:
 * - Extracción automática de salt del hash
 * - Comparación timing-safe (resistente a timing attacks)
 * - Operación síncrona para simplicidad
 * - Compatibilidad con diferentes versiones de bcrypt
 * 
 * SEGURIDAD:
 * - Tiempo de comparación constante
 * - No exposición de información sobre hash
 * - Validación completa de formato
 * - Resistente a ataques de timing
 * 
 * USO TÍPICO:
 * - Login de usuarios: validar contraseña ingresada
 * - Cambio de contraseña: verificar contraseña actual
 * - Autenticación de APIs: validar credenciales
 * - Verificación de identidad: confirmar contraseña
 */
export const isValidPassword = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};
