# Validación de VoxTexto 0.2.0

## Actualización

- Trece pruebas unitarias y siete flujos de navegador correctos.
- Prueba adicional de la PWA compilada: la interfaz sigue abriendo después de activar el modo sin conexión. El service worker almacena solo recursos estáticos de la app; el modelo tiene una caché separada.
- Pruebas de voz real contra la compilación de producción: detección automática de inglés y español latinoamericano correctas.
- Para español se utilizó un clip público del corpus Google FLEURS `es_419`, archivo `10027710469591428283.wav` del conjunto dev. La prueba del navegador fija `locale: en-US` para comprobar que no depende del idioma del navegador. No se utilizó ni se envió la grabación privada de la persona usuaria a ningún servicio.
- Se encontró y corrigió un fallo real: Transformers.js 4.3.1 usa inglés por defecto cuando no se especifica idioma. La integración 0.1.0 no debía presentar esa omisión como detección automática. La nueva detección predice tokens de idioma desde muestras del audio y proporciona explícitamente el idioma al transcribir.
- Los perfiles de español se verifican como preferencias regionales sobre el mismo reconocimiento, sin prometer un modelo dialectal nuevo.
- Los cambios se prepararon en una carpeta y un servidor separados para no recargar ni perder el texto de la sesión 0.1.0.
- Se revisaron visualmente la ayuda con párrafos y las instrucciones de instalación en una pantalla de 390 px. No se ha instalado aún en un teléfono físico ni se ha desplegado en HTTPS.
- No se ha creado ni conectado un bot de reuniones: su viabilidad y fuentes están en `REUNIONES.md`.

## Comprobaciones conservadas de la versión anterior

Comprobaciones realizadas el 20 de octubre de 2026:

- Compilación TypeScript y build de producción de Vite: correctos.
- Ocho pruebas unitarias: admisión de archivos, límite de duración, texto con marcas de tiempo, nombres de archivo, conteo Unicode y selección de fuentes para PDF.
- Cinco pruebas de navegador: edición y generación de los tres formatos, metadatos reales en el límite de una hora, cancelación, vista de 390 px con ayuda accesible y PDF multilingüe de varias páginas.
- Prueba real de reconocimiento con Whisper Base en CPU, versión de desarrollo: correcta.
- Prueba real de reconocimiento en modo automático, versión compilada de producción: correcta.
- El audio público utilizado fue el ejemplo de voz JFK de la documentación de Transformers.js. Las transcripciones obtenidas contienen la frase hablada esperada; esto es una prueba de funcionamiento, no una evaluación de precisión multilingüe.
- Se verificó que el DOCX contiene el texto corregido y sus marcas de tiempo en el XML del documento. Se extrajo el texto del PDF latino y se renderizaron y revisaron sus páginas y las dos páginas de un PDF con chino, japonés, árabe e hindi.
- Auditoría npm: cero vulnerabilidades reportadas en el momento de la comprobación.

## Límites de estas comprobaciones

- No se transcribió una grabación completa de una hora. Se comprobó la admisión de un WAV de 3600 segundos y el rechazo de uno de 3601 segundos.
- No se evaluaron los 99 idiomas ni una matriz de equipos o navegadores. Los errores de reconocimiento siguen requiriendo revisión humana.
- El Windows restringido de pruebas cancela las descargas de disco gestionadas por Chrome. Se verificaron los Blobs reales del exportador, sus nombres y su contenido mediante el runner; no se verificó el diálogo de guardado del usuario.
- Los PDF que necesitan fuentes ajenas a Roboto contienen páginas renderizadas como imágenes. La disponibilidad de glifos depende de las fuentes del sistema; se recomienda DOCX/TXT cuando se necesite texto seleccionable.
- La compilación nativa de Windows queda pendiente: este entorno tiene WebView2, pero no Rust/Cargo ni Visual Studio Build Tools con MSVC/SDK. El código Tauri y el flujo manual de GitHub Actions están preparados, sin afirmar que exista ya un instalador probado.
- El proyecto todavía no se ha subido a GitHub ni se ha desplegado públicamente.
