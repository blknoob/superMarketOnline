/**
 * PRUEBA FINAL - CONTROL DE CAMBIO CON EUR = 4
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

async function testFinalUpdate() {
  console.log('🧪 PRUEBA FINAL: ACTUALIZACIÓN CON EUR = 4');
  console.log('=========================================\n');
  
  try {
    console.log('🔧 1. Actualizando precios con cotización EUR = 4...');
    
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
    
    console.log(`Status: ${updateResult.status}`);
    console.log('Respuesta:');
    console.log(JSON.stringify(updateResult.data, null, 2));
    
    if (updateResult.status === 200 && updateResult.data.status === 'success') {
      console.log(`\n✅ Actualización exitosa: ${updateResult.data.data.updatedCount} productos`);
      console.log(`💱 Cotización aplicada: ${updateResult.data.data.eurRate} Bs/EUR`);
      console.log(`🧮 ${updateResult.data.data.calculation}`);
      
      // Esperar un poco y verificar productos
      console.log('\n⏳ Esperando 2 segundos para verificar cambios...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('\n🔍 2. Verificando productos después de la actualización...');
      
      const getProductsOptions = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/products',
        method: 'GET'
      };
      
      const productsResult = await makeRequest(getProductsOptions);
      
      if (productsResult.status === 200 && productsResult.data.products) {
        const products = productsResult.data.products.slice(0, 3);
        console.log(`\n📦 Verificando primeros ${products.length} productos:\n`);
        
        let allCorrect = true;
        
        products.forEach((product, i) => {
          const expectedPrice = (product.ref || 6) * 4;
          const actualPrice = product.price;
          const correct = Math.abs(actualPrice - expectedPrice) < 0.01;
          
          if (!correct) allCorrect = false;
          
          console.log(`${i+1}. ${product.title}`);
          console.log(`   REF: ${product.ref || 6} EUR`);
          console.log(`   Precio actual: ${actualPrice} Bs`);
          console.log(`   Precio esperado: ${expectedPrice} Bs`);
          console.log(`   ${correct ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
          console.log('');
        });
        
        console.log(`\n🎯 RESULTADO FINAL: ${allCorrect ? '✅ TODO CORRECTO' : '❌ HAY PROBLEMAS'}`);
        
        if (allCorrect) {
          console.log('🎉 ¡El control de cambio manual funciona perfectamente!');
          console.log('💰 Los precios se actualizaron correctamente a 24 Bs (6 EUR × 4)');
        } else {
          console.log('⚠️  Aún hay problemas con la actualización de precios');
        }
        
      } else {
        console.log('❌ No se pudieron obtener los productos para verificar');
      }
      
    } else {
      console.log('\n❌ Error en la actualización');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testFinalUpdate();