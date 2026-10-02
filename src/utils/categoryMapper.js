/**
 * MAPEADOR DE CATEGORÍAS - ORGANIZACIÓN DEL CATÁLOGO
 * 
 * Utilidad para mapear y gestionar la estructura jerárquica de categorías
 * Proporciona mapeo entre categorías legacy y nueva estructura organizada
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Mapeo de categorías actuales a estructura jerárquica
 * - Definición de categorías principales y subcategorías
 * - Migración de datos de productos existentes
 * - Validación y normalización de categorías
 * 
 * ESTRUCTURA JERÁRQUICA:
 * - Categoría Principal (mainCategory): Agrupación de alto nivel
 * - Subcategoría (subCategory): Especialización dentro de la principal
 * - Categoría Legacy (category): Categoría original del sistema
 * 
 * BENEFICIOS:
 * - Organización mejorada del catálogo
 * - Navegación jerárquica para usuarios
 * - Filtrado avanzado de productos
 * - Consistencia en la clasificación
 * 
 * CASOS DE USO:
 * - Migración de productos existentes
 * - Validación en creación de productos
 * - Generación de menús de navegación
 * - Filtros de búsqueda avanzada
 * 
 * INTEGRACIÓN DEL SISTEMA:
 * - ProductsService: Validación de categorías
 * - Views: Menús de navegación
 * - Admin: Interfaces de gestión
 * - APIs: Filtros de consulta
 */

/**
 * MAPEO DE CATEGORÍAS LEGACY A ESTRUCTURA JERÁRQUICA
 * 
 * Diccionario que mapea categorías existentes del sistema
 * a la nueva estructura de categoría principal + subcategoría
 * 
 * PROPÓSITO:
 * - Mantener compatibilidad con productos existentes
 * - Migrar gradualmente a nueva estructura
 * - Normalizar categorización inconsistente
 * - Facilitar actualización masiva de productos
 * 
 * ESTRUCTURA:
 * 'Categoria Legacy': {
 *   mainCategory: 'Categoría Principal',
 *   subCategory: 'Subcategoría Específica'
 * }
 * 
 * EJEMPLOS:
 * - 'Lácteos' -> Alimentación / Lácteos
 * - 'Limpieza' -> Limpieza / Productos de Limpieza
 * - 'Frutas' -> Alimentación / Frutas
 */
/**
 * Mapeo de categorías actuales a categorías principales y subcategorías
 */
export const categoryMapping = {
  'Lácteos': {
    mainCategory: 'Alimentación',
    subCategory: 'Lácteos'
  },
  'Panadería': {
    mainCategory: 'Alimentación',
    subCategory: 'Panadería'
  },
  'Huevos': {
    mainCategory: 'Alimentación',
    subCategory: 'Huevos y Derivados'
  },
  'Almacén': {
    mainCategory: 'Alimentación',
    subCategory: 'Despensa'
  },
  'Frutas': {
    mainCategory: 'Alimentación',
    subCategory: 'Frutas'
  },
  'Verduras': {
    mainCategory: 'Alimentación',
    subCategory: 'Verduras'
  },
  'Limpieza': {
    mainCategory: 'Limpieza',
    subCategory: 'Productos de Limpieza'
  },
  'Categoría Actualizada': {
    mainCategory: 'Alimentación',
    subCategory: 'Varios'
  }
};

/**
 * MAPEAR CATEGORÍA A ESTRUCTURA JERÁRQUICA
 * 
 * Función que convierte una categoría legacy en estructura jerárquica
 * Proporciona fallback para categorías no mapeadas
 * 
 * @param {string} currentCategory - Categoría existente a mapear
 * @returns {Object} Objeto con mainCategory y subCategory
 * 
 * PROCESO:
 * 1. Buscar categoría en diccionario de mapeo
 * 2. Retornar estructura jerárquica si existe
 * 3. Aplicar fallback a 'Alimentación' si no existe
 * 4. Preservar nombre original como subcategoría
 * 
 * RESPUESTA EXITOSA:
 * {
 *   mainCategory: 'Alimentación',
 *   subCategory: 'Lácteos'
 * }
 * 
 * RESPUESTA FALLBACK:
 * {
 *   mainCategory: 'Alimentación',
 *   subCategory: 'Categoría Original' | 'Sin categoría'
 * }
 * 
 * CASOS DE USO:
 * - Migración de productos existentes
 * - Normalización de categorías inconsistentes
 * - Validación en formularios de producto
 * - Actualizaciones masivas de catálogo
 */
/**
 * Función para obtener categoría principal y subcategoría desde categoría actual
 */
export function mapCategory(currentCategory) {
  const mapping = categoryMapping[currentCategory];
  if (mapping) {
    return {
      mainCategory: mapping.mainCategory,
      subCategory: mapping.subCategory
    };
  }
  
  // Default para categorías no mapeadas
  return {
    mainCategory: 'Alimentación',
    subCategory: currentCategory || 'Sin categoría'
  };
}

/**
 * LISTA DE CATEGORÍAS PRINCIPALES
 * 
 * Array con todas las categorías de primer nivel disponibles
 * Utilizadas para navegación principal y validación
 * 
 * CATEGORÍAS DEFINIDAS:
 * - Alimentación: Productos comestibles y consumibles
 * - Limpieza: Productos para limpieza del hogar
 * - Higiene Personal: Cuidado y aseo personal
 * - Bebidas: Líquidos y bebidas diversas
 * - Hogar: Utensilios y artículos para el hogar
 * - Bebés y Niños: Productos especializados para menores
 * 
 * CASOS DE USO:
 * - Generación de menús de navegación
 * - Validación de formularios de producto
 * - Filtros de búsqueda principal
 * - Organización de interfaces administrativas
 * 
 * EXTENSIBILIDAD:
 * - Fácil agregación de nuevas categorías principales
 * - Mantenimiento centralizado de estructura
 * - Consistencia en todo el sistema
 */
/**
 * Lista de categorías principales disponibles
 */
export const mainCategories = [
  'Alimentación',
  'Limpieza', 
  'Higiene Personal',
  'Bebidas',
  'Hogar',
  'Bebés y Niños'
];

/**
 * SUBCATEGORÍAS ORGANIZADAS POR CATEGORÍA PRINCIPAL
 * 
 * Diccionario que define todas las subcategorías disponibles
 * organizadas por su categoría principal correspondiente
 * 
 * ESTRUCTURA:
 * 'Categoría Principal': [
 *   'Subcategoría 1',
 *   'Subcategoría 2',
 *   ...
 * ]
 * 
 * CARACTERÍSTICAS:
 * - Organización jerárquica completa
 * - Cobertura exhaustiva de tipos de productos
 * - Fácil mantenimiento y extensión
 * - Validación de consistencia categoría-subcategoría
 * 
 * CASOS DE USO:
 * - Menús en cascada de navegación
 * - Validación de coherencia en formularios
 * - Filtros de búsqueda avanzada
 * - Generación dinámica de interfaces
 * 
 * BENEFICIOS:
 * - Navegación intuitiva para usuarios
 * - Filtrado preciso de productos
 * - Organización lógica del catálogo
 * - Facilita la búsqueda específica
 */
/**
 * Subcategorías por categoría principal
 */
export const subCategoriesByMain = {
  'Alimentación': [
    'Lácteos',
    'Carnes y Pollo',
    'Frutas',
    'Verduras',
    'Panadería',
    'Huevos y Derivados',
    'Despensa',
    'Congelados',
    'Varios'
  ],
  'Limpieza': [
    'Productos de Limpieza',
    'Papel Higiénico y Servilletas',
    'Detergentes',
    'Desinfectantes'
  ],
  'Higiene Personal': [
    'Cuidado Personal',
    'Cuidado del Cabello',
    'Cuidado Oral',
    'Perfumería'
  ],
  'Bebidas': [
    'Gaseosas',
    'Jugos',
    'Agua',
    'Bebidas Alcohólicas',
    'Bebidas Calientes'
  ],
  'Hogar': [
    'Utensilios',
    'Decoración',
    'Jardinería',
    'Electrodomésticos'
  ],
  'Bebés y Niños': [
    'Pañales',
    'Alimentos Infantiles',
    'Cuidado del Bebé',
    'Juguetes'
  ]
};