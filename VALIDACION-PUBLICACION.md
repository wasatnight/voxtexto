# Comprobaciones del paquete de publicación

Preparado el 20 de octubre de 2026 para `https://voztexto.com`.

## Correcto en el entorno local

- Compilación de TypeScript y de la aplicación para la ruta `/app/`.
- Generación de 8 páginas públicas indexables, sitemap XML con sus URLs canónicas y robots.txt que referencia ese sitemap.
- Resolución de los enlaces y recursos locales de los 10 HTML del paquete, incluidos el editor y la página 404.
- Trece pruebas unitarias de las funciones existentes de audio, texto e idioma.
- Cinco pruebas de publicación en Chrome: páginas/sitemap/robots y códigos HTTP, exportaciones TXT/DOCX/PDF bajo la CSP del editor, anchura de 390 px, interfaz PWA sin conexión y transcripción automática de voz española con la política de seguridad de publicación aplicada.
- El audio de comprobación es una muestra pública de Google FLEURS `es_419`, no una grabación privada del usuario.
- Sin solicitudes a AdSense, DoubleClick o Google Analytics en la prueba del editor.
- Revisión visual de la portada y de su versión móvil.
- Apariencia clara y oscura: botón, preferencia guardada entre páginas públicas y editor, recarga, seguimiento del sistema sin elección previa y funcionamiento sin acceso al almacenamiento local.
- Comprobación de apariencia en Chrome con archivos compilados servidos mediante interceptación local: anchos de 320 a 1440 px sin desbordamiento horizontal; cambiar el tema conserva la geometría de la portada. Capturas claras y oscuras en `docs/`.
- Auditoría npm sin vulnerabilidades reportadas en la comprobación.

## Pendiente al publicar

- Comprar el dominio y confirmar su disponibilidad y precio en el registrador. La consulta RDAP no equivale a una reserva.
- Vincular DNS, activar SSL y subir los archivos al `public_html` correcto.
- Comprobar el funcionamiento real de `.htaccess`, tipos MIME, redirecciones y 404 en Hostinger. La vista previa local reproduce la CSP de la aplicación, no ejecuta Apache/LiteSpeed.
- Verificar Search Console con el token propio de la cuenta y enviar el sitemap.
- Crear y comprobar un correo público; completar los datos del responsable y revisar los textos de privacidad antes de solicitar AdSense.
- Obtener el ID real de AdSense, la aprobación del sitio y configurar consentimiento antes de activar publicidad en páginas públicas. La publicación no carga anuncios.
- Probar instalación y rendimiento en teléfonos físicos. La prueba móvil realizada utiliza una ventana de 390 px en Chrome de escritorio.

No se ha realizado ninguna compra, publicación en Hostinger, alta en Search Console ni activación de anuncios desde esta conversación. El instalador nativo y la captura de audio del sistema siguen siendo una fase posterior.
