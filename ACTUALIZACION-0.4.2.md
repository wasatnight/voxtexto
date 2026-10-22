# Actualización a 0.4.2

Esta actualización reúne el sitio público y la aplicación de escritorio en el mismo código fuente.

- Windows usa Electron para captura loopback, mezcla opcional del micrófono, pausa/reanudación y guardado del audio. El usuario inicia la captura explícitamente; no es un bot de reuniones.
- El ejecutable tiene nombre, identidad e icono de VoxTexto.
- El editor incorpora Eliminar audio con confirmación cuando hay contenido en la sesión, limpieza del reproductor y liberación de su URL temporal.
- El selector de idiomas admite teclado y utiliza las barras de desplazamiento de la paleta de la aplicación.
- Se conservan el modo claro/oscuro y el enlace al blog https://ciberpractico.com/.
- La configuración del dominio de publicación se conserva; la compra y el despliegue siguen pendientes.
- La compilación manual de Windows en Actions utiliza las rutas de Electron en `release/` y entrega artefactos de prueba, sin publicar una release automáticamente.

## Comprobaciones sobre la copia preparada para GitHub

- Instalación reproducible con `npm ci --ignore-scripts` para las comprobaciones locales.
- `npm test`: 13 pruebas correctas.
- `npm run build:hostinger`: TypeScript y Vite correctos.
- `npm run verify:hostinger`: 10 HTML y 8 URLs de sitemap, con recursos locales presentes.
- `node scripts/check-audio-controls.mjs`: carga y eliminación de audio, recarga del mismo archivo, protección de ediciones al cancelar, limpieza al confirmar y bloqueo durante reconocimiento. El Worker de reconocimiento se simula para probar estos estados.
- `node scripts/check-appearance.mjs`: preferencia de tema, almacenamiento no disponible, navegación entre portada y editor, geometría y anchos de 320 a 1440 px.

Las pruebas previas del ejecutable 0.4.2, con fuentes sintéticas y sin capturar sonido privado, se describen en `VALIDACION-ESCRITORIO.md`. No se vuelve a presentar esa validación como una nueva prueba de llamada real. La comprobación con dispositivos físicos y llamadas reales sigue pendiente.

No se incluyen dependencias instaladas, modelos, grabaciones, documentos de prueba, cachés ni ejecutables en el commit de código fuente. Los informes históricos del repositorio se conservan como referencia de sus respectivas versiones.
