/**
 * Script de prueba para verificar API de cotización
 */

import axios from 'axios';

const testAPI = async () => {
  try {
    console.log('🔍 Probando API de DolarAPI...');
    
    const response = await axios.get('https://api.dolarapi.com/v1/cotizaciones/eur', {
      timeout: 5000,
      headers: {
        'User-Agent': 'SuperMercadoOnline/1.0'
      }
    });
    
    console.log('✅ Respuesta de API:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('📋 Status:', error.response?.status);
    console.log('📋 Data:', error.response?.data);
  }
};

testAPI();