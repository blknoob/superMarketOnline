/**
 * @fileoverview Configuración global de tests
 * 
 * Archivo de setup que configura el entorno de testing para toda la suite.
 * Establece variables de entorno, helpers globales, hooks de Jest y
 * utilidades compartidas para todos los tests de la aplicación.
 * 
 * CONFIGURACIONES:
 * - Variables de entorno para testing
 * - Hooks globales de Jest (beforeAll, beforeEach, afterEach)
 * - Helpers de creación de datos de prueba
 * - Mocking y cleanup automático
 * 
 * HELPERS DISPONIBLES:
 * - createTestUser: Genera usuarios de prueba
 * - createTestProduct: Genera productos de prueba
 * - createTestCart: Genera carritos de prueba
 * 
 * SEGURIDAD:
 * - Secrets de test aislados de producción
 * - Entorno NODE_ENV configurado como 'test'
 * - Cleanup automático entre tests
 * - Aislamiento de mocks y datos
 * 
 * CASOS DE USO:
 * - Setup inicial de todos los tests
 * - Creación consistente de datos de prueba
 * - Cleanup y aislamiento entre tests
 * - Configuración de entorno de testing
 * 
 * @author Sistema SuperMercado Online
 * @version 1.0.0
 * @since 2026-01-02
 */

// Setup global para tests

/**
 * Hook de configuración inicial global
 * 
 * Ejecuta una vez antes de todos los tests para establecer
 * el entorno de testing con variables de entorno seguras
 * y configuración específica para pruebas.
 * 
 * CONFIGURACIONES:
 * - NODE_ENV configurado como 'test'
 * - Secrets de JWT, cookies y sesiones para testing
 * - Aislamiento completo del entorno de producción
 */
beforeAll(() => {
  // Configurar variables de entorno para tests
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.COOKIE_SECRET = 'test_cookie_secret';
  process.env.SESSION_SECRET = 'test_session_secret';
});

/**
 * Hook de limpieza antes de cada test
 * 
 * Ejecuta antes de cada test individual para garantizar
 * aislamiento y estado limpio. Limpia todos los mocks
 * para evitar interferencias entre tests.
 */
beforeEach(() => {
  // Limpiar todos los mocks antes de cada test
  jest.clearAllMocks();
});

/**
 * Hook de limpieza después de cada test
 * 
 * Ejecuta después de cada test individual para restaurar
 * mocks y limpiar estado. Garantiza que cada test comience
 * con un estado predecible y aislado.
 */
afterEach(() => {
  // Limpiar después de cada test si es necesario
  jest.restoreAllMocks();
});

/**
 * Helpers globales para creación de datos de prueba
 * 
 * Conjunto de funciones utilitarias disponibles globalmente
 * para crear objetos de prueba consistentes y realistas.
 * Cada helper permite personalización mediante overrides.
 * 
 * CARACTERÍSTICAS:
 * - Datos predeterminados realistas
 * - Customización mediante parámetro overrides
 * - IDs consistentes para testing
 * - Estructura compatible con modelos reales
 * 
 * DISPONIBLES:
 * - createTestUser: Usuario con datos completos
 * - createTestProduct: Producto con inventario
 * - createTestCart: Carrito vacío o con productos
 */
global.testHelpers = {
  // Helper para crear usuario de prueba
  createTestUser: (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439011',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'user',
    age: 25,
    ...overrides
  }),

  // Helper para crear producto de prueba
  createTestProduct: (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439012',
    title: 'Producto de Prueba',
    description: 'Descripción del producto',
    price: 100,
    category: 'test',
    code: 'TEST001',
    stock: 10,
    image: '/images/test.jpg',
    ...overrides
  }),

  // Helper para crear carrito de prueba
  createTestCart: (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439013',
    user: '507f1f77bcf86cd799439011',
    products: [],
    ...overrides
  })
};