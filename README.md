# Smart Parking

Prototipo que integra un backend Node.js y Express, una aplicación móvil con React Native y Expo, una interfaz web y un dispositivo ESP32 para explorar la gestión de estacionamientos.

## Configuración

El repositorio incluye marcadores de ejemplo para la dirección del servidor, la red Wi-Fi y la clave de mapas. Configurá tus propios valores en un entorno local antes de ejecutar el sistema. No subas credenciales reales.

Requiere Node.js, una base MySQL y las herramientas correspondientes a Expo y ESP32. La conexión de ejemplo de MySQL está en `backend/db/db.js`: configurala para tu propia base local antes de ejecutarlo. Para instalar el servidor ejecutá `npm ci` en la raíz y después `npm start`; para la aplicación móvil, instalá las dependencias en `mobile/` y ejecutá `npm start` desde esa carpeta.

Proyecto en desarrollo: esta copia no incluye el esquema de creación de las tablas de MySQL. La ejecución completa requiere preparar la base, configurar el servicio de mapas y disponer del hardware. Las rutas del prototipo no implementan autenticación; usalo únicamente en un entorno local aislado.
