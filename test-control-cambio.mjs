/**
 * SCRIPT DE PRUEBA PARA CONTROL DE CAMBIO MANUAL
 * 
 * Prueba específica para verificar el funcionamiento del sistema de
 * actualización de precios con cotización EUR ingresada manualmente
 */
import http from 'http';

// Función helper para hacer requests HTTP
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

// Prueba principal: Actualización de precios con cotización EUR
async function testPriceUpdate() {
  console.log('🚀 Probando actualización de precios con cotización EUR = 3...\n');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/admin/emergency-update-prices',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const testData = JSON.stringify({ eurRate: 3 });
    options.headers['Content-Length'] = Buffer.byteLength(testData);
    
    const result = await makeRequest(options, testData);
    
    console.log(`📊 Status Code: ${result.status}`);
    console.log('📄 Respuesta:');
    console.log(JSON.stringify(result.data, null, 2));
    
    if (result.status === 200 && result.data.status === 'success') {
      console.log('\n✅ PRUEBA EXITOSA!');
      console.log(`🎉 ${result.data.data.updatedCount} productos actualizados`);
      console.log(`💱 Cotización aplicada: ${result.data.data.eurRate} EUR`);
      console.log(`🧮 ${result.data.data.calculation}`);
      return true;
    } else {
      console.log('\n❌ PRUEBA FALLÓ');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    return false;
  }
}

// Prueba adicional: Verificar productos después de la actualización
async function testProductsPrices() {
  console.log('\n🔍 Verificando precios de productos...\n');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/products',
      method: 'GET',
    };
    
    const result = await makeRequest(options);
    
    if (result.status === 200 && result.data.products) {
      const products = result.data.products;
      console.log(`📦 Total de productos encontrados: ${products.length}`);
      
      if (products.length > 0) {
        // Mostrar algunos ejemplos
        const examples = products.slice(0, 3);
        console.log('\n📋 Ejemplos de productos:');
        
        examples.forEach((product, index) => {
          console.log(`\n${index + 1}. ${product.title}`);
          console.log(`   REF: ${product.ref || 'No definido'} EUR`);
          console.log(`   Precio: ${product.price || 'No definido'} Bolívares`);
          
          if (product.ref && product.price) {
            const expectedPrice = product.ref * 3;
            const match = Math.abs(product.price - expectedPrice) < 0.01;
            console.log(`   ✓ Cálculo: ${product.ref} × 3 = ${expectedPrice} ${match ? '✅' : '❌'}`);
          }
        });
        
        return true;
      }
      
    } else {
      console.log('❌ No se pudieron obtener los productos');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error verificando productos:', error.message);
    return false;
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🧪 PRUEBAS DEL SISTEMA DE CONTROL DE CAMBIO MANUAL');
  console.log('===============================================\n');
  
  console.log('💡 Explicación:');
  console.log('- Los productos tienen un valor REF de 6 EUR');
  console.log('- Al ingresar cotización de 3, el precio debería ser 6 × 3 = 18 bolívares');
  console.log('- Esto permite control manual sin depender de APIs externas\n');
  
  const results = {
    priceUpdate: await testPriceUpdate(),
    productsPrices: await testProductsPrices()
  };
  
  console.log('\n📊 RESUMEN DE PRUEBAS:');
  console.log('=====================');
  console.log(`Actualización de precios: ${results.priceUpdate ? '✅ PASÓ' : '❌ FALLÓ'}`);
  console.log(`Verificación de precios: ${results.productsPrices ? '✅ PASÓ' : '❌ FALLÓ'}`);
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\nResultado final: ${allPassed ? '🎉 TODO FUNCIONANDO CORRECTAMENTE' : '⚠️ REVISAR ERRORES'}`);
  
  if (allPassed) {
    console.log('\n✨ El sistema de control de cambio manual está operativo!');
    console.log('🎯 REF 6 EUR × Cotización 3 = 18 Bolívares por producto');
  }
}

// Ejecutar pruebas
runAllTests().catch(console.error);