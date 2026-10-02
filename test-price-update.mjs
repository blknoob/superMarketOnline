/**
 * SCRIPT DE PRUEBA - ACTUALIZACIÓN DE PRECIOS
 * 
 * Script para probar la funcionalidad de actualización de precios
 * con cotización EUR manual sin necesidad de autenticación
 */
import http from 'http';

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
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

async function testPriceUpdate() {
  try {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/admin/emergency-update-prices',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify({ eurRate: 3 }))
      }
    };

    const data = JSON.stringify({ eurRate: 3 });
    const result = await makeRequest(options, data);
    
    console.log('✅ Resultado de actualización de precios:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.status === 'success') {
      console.log('🎉 Precios actualizados correctamente!');
      console.log(`📊 ${result.data.updatedCount} productos actualizados`);
      console.log(`💱 Cotización EUR: ${result.data.eurRate}`);
      console.log(`🧮 Cálculo: ${result.data.calculation}`);
    }
    
  } catch (error) {
    console.error('❌ Error al actualizar precios:', error.message);
  }
}

// Ejecutar el test
console.log('🚀 Iniciando prueba de actualización de precios...');
testPriceUpdate();