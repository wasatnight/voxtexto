# VoxTexto para Windows · 0.4.2 · versión de prueba

## Abrir la app

1. Descomprime **todo** `VoxTexto-Windows-0.4.2-portable.zip` en una carpeta de tu equipo.
2. Abre `VoxTexto.exe` dentro de esa carpeta. Conserva a su lado las demás carpetas y archivos.
3. No necesitas iniciar sesión en Google o Microsoft. La app no se une como bot a las reuniones.

Está preparada para Windows 10/11 de 64 bits. Esta entrega es portable: no modifica el inicio de Windows ni instala un servicio. Todavía no tiene firma de editor.

## Grabar y transcribir

1. Abre la llamada o el audio que deseas procesar y avisa a las personas que participen.
2. Activa **Incluir mi micrófono** si quieres incorporar tu voz. Si lo dejas desactivado, se captura únicamente la salida de sonido de Windows.
3. Pulsa **Grabar audio del sistema**. Puedes pausar y reanudar.
4. Pulsa **Detener y revisar**. Escucha la grabación en el reproductor.
5. Guarda el audio si quieres conservarlo. Después selecciona su idioma y pulsa **Transcribir audio**.
6. Revisa el texto y descarga TXT, Word o PDF.

La app captura la mezcla de salida del sistema, incluyendo otras aplicaciones y notificaciones. No selecciona exclusivamente Meet o Teams ni identifica a los participantes. Usa audífonos para reducir el eco al incluir el micrófono. Los cambios de dispositivo de sonido durante la grabación pueden interrumpir la captura; empieza otra grabación si ocurre.

El máximo es de 60 minutos de audio activo. La pausa no cuenta dentro del tiempo grabado. También se aplica un límite de seguridad de tamaño. Mantén la app abierta y evita suspender Windows manualmente.

## Datos e internet

### Quitar un audio de la sesión

Junto a **Cambiar audio** encontrarás **Eliminar audio**. Limpia el audio cargado y su transcripción para que puedas seleccionar otro archivo sin cerrar la app. Si hay una grabación o texto sin conservar, pide confirmación antes de descartarlos. Los archivos originales y las descargas guardadas en tu equipo se conservan.

El menú de idiomas permite desplazarte con las flechas, elegir con Enter, cerrar con Escape o escribir las primeras letras de un idioma.

El audio y el texto se mantienen en memoria durante la sesión. Solo se escriben en disco si utilizas Guardar audio o Descarga. No hay base de datos, cuenta ni historial de grabaciones.

Cerrar sin guardar hace perder la grabación y la transcripción. La app avisa al cerrar si hay trabajo sin conservar.

El modelo de reconocimiento y su motor se descargan desde Hugging Face y sus proveedores la primera vez. Esos archivos pueden quedar en la caché local de la app. Las solicitudes de descarga no contienen tu grabación. Para transcribir sin conexión deben haberse descargado antes los componentes necesarios.

## Estado de las pruebas

La compilación, la captura con fuentes sintéticas, mezcla de micrófono, pausa/reanudación, decodificación WebM, manejo de permisos denegados, guardado nativo, transcripción real de una muestra pública de español y exportación TXT/DOCX/PDF se comprobaron automáticamente.

Falta comprobar contigo la captura de una llamada real, tus audífonos/micrófono y los cambios de dispositivo. Las pruebas no grabaron el sonido privado del usuario.

No se entrega todavía un instalador Setup: el compilador NSIS de 32 bits no pudo ejecutarse en el entorno de construcción. La versión portable utiliza el mismo código de la aplicación.

## Código fuente

En el ZIP de código fuente:

```powershell
npm ci
npm run desktop:dev
```

Para generar la carpeta portable:

```powershell
npm run desktop:portable
```

Para generar un instalador desde un Windows que permita ejecutar NSIS:

```powershell
npm run desktop:build
```

La salida queda en `release/`. El reconocimiento sigue utilizando Whisper Base mediante Transformers.js; la interfaz, captura y edición pertenecen a VoxTexto.
