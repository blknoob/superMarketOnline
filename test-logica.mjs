/**
 * PRUEBA RÁPIDA - VERIFICAR LÓGICA DE ACTUALIZACIÓN
 */

// Simular el comportamiento esperado
const productos = [
    { _id: '1', title: 'Producto 1', ref: 6, price: 18 },
    { _id: '2', title: 'Producto 2', ref: 6, price: 18 },
    { _id: '3', title: 'Producto 3', ref: 6, price: 18 }
];

console.log('🔍 DIAGNOSTICANDO PROBLEMA DE ACTUALIZACIÓN');
console.log('==========================================\n');

console.log('📊 Estado inicial:');
productos.forEach((p, i) => {
    console.log(`${i+1}. ${p.title} | REF: ${p.ref} EUR | Precio: ${p.price} Bs`);
});

// Simular actualización con EUR = 4
const eurRate = 4;
console.log(`\n💱 Aplicando cotización EUR = ${eurRate}...`);

productos.forEach(producto => {
    const nuevoPrecio = producto.ref * eurRate;
    console.log(`\n🔄 ${producto.title}:`);
    console.log(`   REF original: ${producto.ref} EUR`);
    console.log(`   Cotización: ${eurRate} Bs/EUR`);
    console.log(`   Cálculo: ${producto.ref} × ${eurRate} = ${nuevoPrecio}`);
    console.log(`   Precio anterior: ${producto.price} Bs`);
    console.log(`   Precio nuevo: ${nuevoPrecio} Bs`);
    producto.price = nuevoPrecio; // Actualizar
});

console.log('\n✅ Estado final después de actualización:');
productos.forEach((p, i) => {
    console.log(`${i+1}. ${p.title} | REF: ${p.ref} EUR | Precio: ${p.price} Bs`);
});

console.log('\n🎯 RESULTADO ESPERADO:');
console.log('Si la lógica funciona correctamente:');
console.log('- REF se mantiene en 6 EUR');
console.log('- Precio se actualiza a 24 Bs (6 × 4)');

// Verificar si hay algún problema en la lógica
const todosCorrectos = productos.every(p => p.price === 24 && p.ref === 6);

console.log(`\n${todosCorrectos ? '✅' : '❌'} Lógica de actualización: ${todosCorrectos ? 'CORRECTA' : 'INCORRECTA'}`);

if (!todosCorrectos) {
    console.log('\n🚨 PROBLEMA DETECTADO:');
    console.log('La lógica básica funciona correctamente aquí.');
    console.log('El problema debe estar en:');
    console.log('1. La función emergencyUpdatePrices del controlador');
    console.log('2. La conexión a la base de datos');
    console.log('3. La actualización de productos no se está ejecutando');
    console.log('4. Hay otra lógica interfiriendo');
}

console.log('\n🔧 PRÓXIMOS PASOS:');
console.log('1. Revisar logs del servidor');
console.log('2. Verificar la función emergencyUpdatePrices');
console.log('3. Comprobar que el endpoint esté respondiendo');
console.log('4. Verificar conexión a MongoDB');