/**
 * SCRIPT DE PRUEBA DIRECTA - CONTROL DE CAMBIO
 * Prueba específica para verificar la actualización de precios
 */
import http from 'http';

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = responseData.startsWith('{') || responseData.startsWith('[') 
            ? JSON.parse(responseData) 
            : responseData;
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// Función para probar con EUR = 4
async function testWithEur4() {
  console.log('🧪 PROBANDO ACTUALIZACIÓN CON EUR = 4 BOLÍVARES');
  console.log('==============================================\n');
  
  try {
    // 1. Primero obtener algunos productos para ver estado actual
    console.log('📦 1. Consultando productos actuales...');
    const getProductsOptions = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/products',
      method: 'GET'
    };
    
    const currentProducts = await makeRequest(getProductsOptions);
    
    if (currentProducts.status === 200 && currentProducts.data.products) {
      const products = currentProducts.data.products.slice(0, 3); // Solo primeros 3
      console.log(`\n📋 Productos ANTES de actualizar (mostrando ${products.length}):`);
      products.forEach((product, i) => {
        console.log(`${i+1}. ${product.title}`);
        console.log(`   REF: ${product.ref || 'N/A'} EUR`);
        console.log(`   Precio: ${product.price || 'N/A'} Bs`);
      });
    }
    
    // 2. Actualizar precios con EUR = 4
    console.log('\n💱 2. Actualizando precios con EUR = 4...');
    const updateOptions = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/admin/emergency-update-prices',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const updateData = JSON.stringify({ eurRate: 4 });
    updateOptions.headers['Content-Length'] = Buffer.byteLength(updateData);
    
    const updateResult = await makeRequest(updateOptions, updateData);
    
    console.log(`\n📊 Status de actualización: ${updateResult.status}`);
    console.log('📄 Respuesta de actualización:');
    console.log(JSON.stringify(updateResult.data, null, 2));
    
    // 3. Verificar productos después de actualizar
    console.log('\n🔍 3. Verificando productos DESPUÉS de actualizar...');
    
    // Esperar un poco para asegurar que la BD se actualizó
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const afterProducts = await makeRequest(getProductsOptions);
    
    if (afterProducts.status === 200 && afterProducts.data.products) {
      const products = afterProducts.data.products.slice(0, 3); // Solo primeros 3
      console.log(`\n📋 Productos DESPUÉS de actualizar (mostrando ${products.length}):`);
      products.forEach((product, i) => {
        const expectedPrice = (product.ref || 6) * 4;
        const actualPrice = product.price;
        const correct = Math.abs(actualPrice - expectedPrice) < 0.01;
        
        console.log(`${i+1}. ${product.title}`);
        console.log(`   REF: ${product.ref || 'N/A'} EUR`);
        console.log(`   Precio: ${actualPrice || 'N/A'} Bs`);
        console.log(`   Esperado: ${expectedPrice} Bs`);
        console.log(`   ${correct ? '✅' : '❌'} ${correct ? 'CORRECTO' : 'INCORRECTO'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar prueba
testWithEur4();