/**
 * PRUEBA DEL NUEVO SISTEMA DE CONFIGURACIÓN EUR
 * 
 * Este script demuestra cómo funciona el nuevo sistema que recuerda
 * el último valor EUR utilizado
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

async function testEurPersistence() {
  console.log('🧪 PROBANDO SISTEMA DE PERSISTENCIA EUR');
  console.log('=====================================\n');
  
  try {
    // 1. Actualizar con EUR = 5.5
    console.log('📝 1. Actualizando precios con EUR = 5.5000...');
    const updateOptions = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/admin/emergency-update-prices',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    const testData = JSON.stringify({ eurRate: 5.5 });
    updateOptions.headers['Content-Length'] = Buffer.byteLength(testData);
    
    const updateResult = await makeRequest(updateOptions, testData);
    
    if (updateResult.status === 200 && updateResult.data.status === 'success') {
      console.log('✅ Actualización exitosa!');
      console.log(`   📊 ${updateResult.data.data.updatedCount} productos actualizados`);
      console.log(`   💱 Valor aplicado: ${updateResult.data.data.eurRate} EUR`);
      console.log(`   🧮 ${updateResult.data.data.calculation}`);
      
      console.log('\n🔍 2. Ahora el sistema debería recordar EUR = 5.5000');
      console.log('   Ve al panel administrativo (/admin/panel)');
      console.log('   El campo EUR debería mostrar 5.5000 en lugar de 2.0000');
      console.log('   Y debería decir "Último valor utilizado" en lugar de "Valor por defecto"');
      
      console.log('\n✨ FUNCIONAMIENTO:');
      console.log('   - Primera vez: Muestra 2.0000 (valor por defecto)');
      console.log('   - Después de actualizar: Muestra el último valor usado');
      console.log('   - Persiste entre sesiones y reinicios del servidor');
      
    } else {
      console.log('❌ Error en actualización:', updateResult.data);
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar prueba
testEurPersistence();