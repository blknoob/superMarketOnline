/**
 * @fileoverview Configuración del motor de plantillas Handlebars
 * 
 * Configuración completa de Handlebars para el renderizado de vistas server-side.
 * Incluye helpers personalizados para operaciones comunes en el frontend:
 * - Cálculos matemáticos (multiply)
 * - Suma total de carrito (sumCartTotal)
 * - Comparaciones (eq)
 * - Formateo de fechas (formatDate)
 * 
 * ESTRUCTURA DE DIRECTORIOS:
 * - layouts/: Plantillas base (main.hbs)
 * - partials/: Componentes reutilizables
 * - views/: Vistas específicas de rutas
 * 
 * SEGURIDAD:
 * - allowProtoPropertiesByDefault: Habilitado para flexibilidad
 * - allowProtoMethodsByDefault: Habilitado para métodos
 * - Validación en helpers para prevenir errores
 * 
 * @author Sistema SuperMercado Online
 * @version 1.0.0
 * @since 2026-01-02
 */

import exphbs from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configura el motor de plantillas Handlebars para Express
 * 
 * Establece la configuración completa incluyendo directorios,
 * extensiones, helpers personalizados y opciones de seguridad.
 * 
 * CONFIGURACIÓN:
 * - Extensión: .hbs
 * - Layout por defecto: main
 * - Directorios: layouts, partials, views
 * - Helpers matemáticos y de formato
 * 
 * HELPERS INCLUIDOS:
 * - multiply: Multiplicación de dos números
 * - sumCartTotal: Suma total de items en carrito
 * - eq: Comparación de igualdad
 * - formatDate: Formato de fechas en español
 * 
 * CASOS DE USO:
 * - Renderizado de páginas principales
 * - Cálculo de totales en carrito
 * - Formateo de fechas de tickets
 * - Comparaciones condicionales en templates
 * 
 * @function configureHandlebars
 * @param {Object} app - Instancia de aplicación Express
 * @returns {void}
 */

const configureHandlebars = (app) => {
  app.engine(
    "hbs",
    exphbs.engine({
      extname: ".hbs",
      defaultLayout: "main",
      layoutsDir: path.join(__dirname, "../views/layouts"),      
      partialsDir: path.join(__dirname, "../views/partials"),
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
      helpers: {
        multiply: (a, b) => a * b,
        sumCartTotal: function (cart) {
          if (!Array.isArray(cart)) return 0;
          return cart.reduce((total, item) => {
            if (item && typeof item.price === "number") {
              return total + item.price * (item.quantity || 1);
            }
            return total;
          }, 0);
        },
        eq: (a, b) => a === b,
        formatDate: function(date) {
          if (!date) return '';
          const d = new Date(date);
          return d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
    })
  );
  app.set("view engine", "hbs");
  app.set("views", path.join(__dirname, "../views"));
};

export { configureHandlebars };
