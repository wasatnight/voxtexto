# Publicar VoxTexto en Hostinger

Este paquete está configurado para **https://voztexto.com** (con «z»). La marca de la herramienta se conserva como **VoxTexto**.

## Lo que se entrega

- `voztexto-hostinger-public_html.zip`: solo los archivos ya compilados para publicar. Al extraerlo, `index.html`, `robots.txt`, `sitemap.xml` y `.htaccess` quedan directamente en la raíz.
- `voztexto-codigo-fuente-v0.3.0.zip`: código fuente y configuración para futuras modificaciones. Este ZIP no se sube a `public_html`.
- Esta guía y los documentos de comprobación.

La portada y sus guías son HTML estático que se puede leer sin JavaScript. La herramienta interactiva está en `/app/`. No se necesita Node.js, PHP ni una base de datos en el servidor para ejecutar esta publicación.

## 1. Comprar y conectar el dominio

La consulta directa al registro RDAP de Verisign para `voztexto.com` respondió HTTP 404 el **20 de octubre de 2026 a las 07:54 UTC (01:54 en Ciudad de México)**. La misma consulta de control a un dominio registrado respondió 200. Esto indica que en ese momento no se encontró el registro de `voztexto.com`; no reserva el nombre ni confirma su precio o disponibilidad comercial final.

Comprueba el dominio en Hostinger antes de pagar, verifica su escritura y revisa el coste de renovación además del primer año. No se ha efectuado ninguna compra por tu cuenta.

Vincula el dominio a tu plan de alojamiento. Usa los registros DNS o servidores de nombre que indique hPanel para ese sitio; no copies direcciones IP de ejemplos.

## 2. Crear el sitio de alojamiento

En hPanel, añade un sitio de tipo **PHP/HTML personalizado / sitio estático**, según las opciones de tu plan. Este paquete se sube al alojamiento con administrador de archivos; no al editor de Hostinger Website Builder.

Activa el certificado SSL para `voztexto.com` y, si lo utilizas, `www.voztexto.com`. El paquete redirige el dominio con `www` al dominio sin `www`, y HTTP a HTTPS cuando la solicitud corresponde a `voztexto.com`.

No cambies los DNS de tu correo sin revisar su configuración cuando lo crees.

## 3. Subir el ZIP correcto

1. Abre **Sitios web → Administrar → Administrador de archivos**.
2. Entra en el `public_html` del dominio correcto.
3. Si existe un sitio anterior, descarga una copia de respaldo antes de sustituirlo. No borres otros sitios o carpetas de la cuenta.
4. Sube `voztexto-hostinger-public_html.zip` y extráelo allí.
5. Comprueba que el archivo principal sea `public_html/index.html`, no `public_html/build/index.html` ni `public_html/voztexto/index.html`.
6. Comprueba que se haya conservado `.htaccess`; el administrador puede ocultar archivos que empiezan por punto.
7. Si hay un `index.php` de bienvenida de una instalación anterior, guarda su copia y retíralo de la raíz de este sitio para evitar que se muestre en lugar del nuevo `index.html`.
8. Cuando termines, retira de `public_html` el ZIP que subiste para no dejar una copia descargable innecesaria del paquete.

La aplicación lleva un archivo WebAssembly de aproximadamente 27 MB, además de JavaScript, fuentes e imágenes. Está incluido en el ZIP. La primera transcripción descarga aparte el modelo desde Hugging Face; los audios siguen procesándose en el dispositivo del visitante.

## 4. Comprobar el sitio publicado

Abre estas direcciones:

- `https://voztexto.com/`
- `https://voztexto.com/app/`
- `https://voztexto.com/como-funciona/`
- `https://voztexto.com/privacidad/`
- `https://voztexto.com/robots.txt`
- `https://voztexto.com/sitemap.xml`
- Una ruta inexistente, para comprobar que el alojamiento responde **404 real**, no 200 con la portada.

Prueba el ejemplo de edición, una transcripción corta y las descargas. Comprueba el instalador web en un Android y en Safari de iPhone/iPad cuando tengas acceso a esos dispositivos. Todavía no se ha verificado esta publicación en un servidor Hostinger real ni en teléfonos físicos.

El servidor de vista previa reproduce la cabecera CSP del editor, pero la interpretación de `.htaccess`, las redirecciones, SSL y compresión deben comprobarse en Hostinger tras subirlo.

## 5. Google Search Console

1. En Search Console, añade una propiedad de tipo **Dominio** con el valor `voztexto.com`.
2. Copia el registro TXT de verificación que Google te entregue y añádelo a la zona DNS activa del dominio.
3. Espera a que el cambio DNS sea visible y pulsa **Verificar**.
4. En **Sitemaps**, envía `https://voztexto.com/sitemap.xml` o `sitemap.xml`, según el campo que aparezca.
5. Usa la inspección de URL para comprobar la portada y las páginas que quieras indexar.

No se ha inventado un token de verificación ni un archivo `google…html`: Google los proporciona para tu cuenta. El sitemap contiene solo las páginas públicas indexables. El editor `/app/` tiene `noindex,follow`, sin bloquear sus recursos mediante `robots.txt`.

El sitemap ayuda a descubrir páginas; no garantiza indexación, posiciones ni aprobación de AdSense. No incluyas exportaciones, audios o transcripciones de usuarios: este sitio no genera URLs públicas para ellos.

## 6. Correo y responsable: completar antes de solicitar AdSense

No se ha publicado una dirección inventada. Las páginas explican que esta versión no ofrece atención personalizada por correo.

Cuando hayas creado un correo que funcione, edita `site.config.json` del código fuente:

```json
{
  "operatorLegalName": "Nombre real o razón social del responsable",
  "contactEmail": "Correo real que ya recibe mensajes"
}
```

Los textos anteriores son instrucciones, no valores para copiar literalmente. Usa los datos reales que decidas publicar y revisa la política de privacidad según la operación y el país del servicio.

Después reconstruye el paquete y actualiza las páginas públicas. Cambiar el archivo de configuración que está en tu computadora no cambia por sí mismo lo que ya subiste.

## 7. AdSense: preparado, pero desactivado

El alta en AdSense no convierte automáticamente un sitio en apto. Debes ser titular elegible, controlar el sitio, aportar contenido propio y cumplir las políticas. Google revisa la solicitud y puede rechazarla. El dominio y el alojamiento tienen sus propios costes aunque la herramienta sea gratis para visitantes.

Este paquete:

- Incluye portada, guías originales, preguntas frecuentes, información del proyecto y páginas de privacidad y términos.
- No contiene un ID de editor inventado, scripts de anuncios ni analítica.
- Incluye un `ads.txt` con comentarios que indican que todavía no hay vendedores publicitarios declarados.
- Mantiene la herramienta `/app/` sin anuncios ni scripts publicitarios. El editor muestra contenido privado; no coloques allí AdSense ni en el contenedor de escritorio.

Cuando dispongas del ID real `pub-` seguido de 16 dígitos, puedes guardarlo en `adsensePublisherId` de `site.config.json`. Al reconstruir se generarán el `ads.txt` correspondiente y la metaetiqueta de cuenta para verificación. **Eso no carga anuncios**.

Para activar anuncios después de aprobación, hay que integrar el código que proporcione tu cuenta únicamente en las páginas públicas adecuadas, actualizar la privacidad y configurar la gestión de consentimiento. Para visitantes del EEE, Reino Unido y Suiza, revisa el requisito de una CMP certificada por Google. Un aviso genérico de cookies no sustituye esa integración.

Evita anuncios junto a botones de descarga o controles que puedan inducir clics accidentales. No solicites clics para «apoyar» el proyecto. El rendimiento económico dependerá del tráfico y de otros factores; no se han estimado ingresos garantizados.

## 8. Reconstruir a futuro

Desde el código fuente, con Node.js 24:

```sh
npm ci
npm test
npm run build:hostinger
npm run verify:hostinger
npm run preview:hostinger
```

La carpeta `build/` contiene lo que va directamente en `public_html`. La vista previa local se abre en `http://127.0.0.1:1424/`. No es una publicación en internet y los archivos no deben abrirse con doble clic desde `file://`.

Si cambia el dominio, actualiza `origin` en `site.config.json` y las reglas de dominio de `site/root.htaccess` antes de reconstruir. Eso actualiza sitemap, robots y URLs canónicas generadas. Conserva una copia de la versión publicada antes de cada actualización.

## Fuentes oficiales consultadas

- Registro .com: https://rdap.verisign.com/com/v1/domain/voztexto.com
- Hostinger: https://www.hostinger.com/support/1583214-how-to-add-a-website-in-hostinger/
- Archivos en Hostinger: https://support.hostinger.com/en/articles/4548688-basic-actions-in-the-file-manager
- Sitemap: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=es
- Verificación de Search Console: https://support.google.com/webmasters/answer/9008080?hl=es
- Requisitos de AdSense: https://support.google.com/adsense/answer/9724?hl=es
- Políticas de anuncios: https://support.google.com/adsense/answer/48182?hl=es
- Privacidad requerida: https://support.google.com/adsense/answer/1348695?hl=es
- ads.txt: https://support.google.com/adsense/answer/12171612?hl=es
- Consentimiento: https://support.google.com/adsense/answer/13554020
