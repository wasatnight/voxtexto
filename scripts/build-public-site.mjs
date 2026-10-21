import {
  readFile,
  writeFile,
  mkdir,
  copyFile,
  readdir,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "build");
const config = JSON.parse(
  await readFile(path.join(root, "site.config.json"), "utf8"),
);
const origin = new URL(config.origin);
const blogUrl = new URL(config.blogUrl);
if (blogUrl.protocol !== "https:" || blogUrl.username || blogUrl.password)
  throw new Error("blogUrl debe ser una dirección HTTPS sin credenciales.");
if (
  origin.protocol !== "https:" ||
  origin.pathname !== "/" ||
  origin.search ||
  origin.hash
)
  throw new Error("origin debe ser un dominio HTTPS sin subcarpetas.");
if (
  config.contactEmail &&
  !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(config.contactEmail)
)
  throw new Error("Correo de contacto inválido.");
if (
  config.adsensePublisherId &&
  !/^pub-\d{16}$/.test(config.adsensePublisherId)
)
  throw new Error("ID de AdSense inválido: usa pub- y 16 dígitos.");
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const url = (route) => new URL(route, origin).href;
const button =
  '<a class="button" href="/app/">Transcribir un audio <span aria-hidden="true">↗</span></a>';
const contact = config.contactEmail
  ? `<p>Puedes contactar al responsable del sitio en <a href="mailto:${escape(config.contactEmail)}">${escape(config.contactEmail)}</a>.</p><p>No adjuntes grabaciones ni transcripciones con información de otras personas.</p>`
  : '<p>Esta versión no ofrece atención personalizada por correo.</p><p>Puedes consultar la <a href="/como-funciona/">guía de uso</a> y las <a href="/preguntas-frecuentes/">preguntas frecuentes</a> para resolver dudas de funcionamiento.</p>';
const operator = escape(config.operatorLegalName || config.operatorPublicName);
const pages = [
  {
    route: "/",
    title: "Audio a texto gratis y en tu dispositivo | VoxTexto",
    description:
      "Transcribe audios de hasta una hora, corrige el texto y descárgalo en TXT, Word o PDF. Sin cuentas ni subir tus grabaciones a un servidor.",
    home: true,
  },
  {
    route: "/como-funciona/",
    title: "Cómo transcribir tu audio paso a paso | VoxTexto",
    description:
      "Aprende a seleccionar un audio, elegir su idioma, revisar la transcripción y descargar el resultado con VoxTexto.",
    heading: "De tu audio a un texto que puedes trabajar.",
    intro:
      "Una guía para tu primera transcripción, desde elegir el archivo hasta guardar el resultado.",
    body: `
    <h2>1. Selecciona un audio de tu equipo</h2><p>Abre la herramienta y pulsa «Seleccionar audio» o arrastra un archivo a la zona de carga.</p><p>El archivo debe durar como máximo 60 minutos y pesar como máximo 100 MB. La duración se comprueba antes de iniciar el modelo.</p><p>MP3 y WAV suelen ser las opciones más compatibles. M4A, OGG, Opus, FLAC, AAC y WebM dependen de los códecs disponibles en tu navegador.</p>
    <h2>2. Indica el idioma que se escucha</h2><p>Si lo conoces, seleccionarlo manualmente ayuda a evitar una identificación equivocada, especialmente cuando la grabación tiene ruido o comienza con un silencio largo.</p><p>«Detectar automáticamente» analiza muestras del propio audio. No utiliza el idioma de Windows o del navegador. En grabaciones con varios idiomas puede escoger uno predominante; no garantiza detectar cada cambio de idioma.</p><p>Las opciones de español para Latinoamérica y España comparten el mismo reconocimiento. La preferencia regional orienta la revisión ortográfica del editor; no traduce ni cambia las expresiones pronunciadas.</p>
    <h2>3. Inicia la transcripción</h2><p>La primera ejecución descarga el modelo de reconocimiento y los componentes del motor. Se requiere internet y la descarga puede alcanzar varios cientos de megabytes, según el modo de procesamiento.</p><p>El audio se procesa en tu dispositivo mediante un proceso separado de la interfaz. Si hay una GPU compatible, la app puede aprovecharla; el modo CPU ofrece otra opción cuando hay problemas de compatibilidad.</p><p>Un archivo de una hora puede tardar bastante y consumir memoria. Empieza con un fragmento corto para conocer el rendimiento de tu equipo. Mantén la app abierta y evita suspender el dispositivo.</p>
    <h2>4. Escucha y corrige</h2><p>La transcripción aparece en segmentos editables con marcas de tiempo. Puedes pulsar una marca para escuchar el audio desde ese punto y modificar las palabras en el editor.</p><p>Revisa nombres propios, números, fechas y palabras técnicas. El reconocimiento puede introducir errores incluso cuando el resultado parece fluido.</p><p>Cambiar el selector de idioma después de terminar no modifica el texto que ya existe: se aplicará a la próxima transcripción. El resultado muestra el idioma utilizado para generarlo.</p>
    <h2>5. Descarga antes de cerrar</h2><p>Elige TXT, Word o PDF y decide si quieres incluir marcas de tiempo. El documento se genera en tu dispositivo.</p><p>El texto de la sesión no se guarda en una cuenta ni en un historial de VoxTexto. Descárgalo para conservarlo antes de cerrar la pestaña o comenzar con otro archivo.</p>
    <h2>Instalar en un celular</h2><p>En Android, abre el menú del navegador y busca «Instalar aplicación» o «Agregar a pantalla principal». En iPhone o iPad, abre el sitio en Safari y usa Compartir → Agregar a pantalla de inicio.</p><p>Instalar la web facilita el acceso, pero no aumenta la memoria ni garantiza procesamiento en segundo plano. El sistema puede pausar la transcripción al bloquear la pantalla.</p>
    <div class="related"><a href="/guias/mejorar-calidad-del-audio/">Cómo preparar una grabación más clara →</a><a href="/preguntas-frecuentes/">Resolver problemas frecuentes →</a></div>`,
  },
  {
    route: "/guias/mejorar-calidad-del-audio/",
    title: "Cómo mejorar un audio antes de transcribirlo | VoxTexto",
    description:
      "Consejos prácticos para reducir ruido, evitar voces superpuestas y revisar una transcripción con mayor cuidado.",
    heading: "Un audio más claro facilita una mejor transcripción.",
    intro:
      "La calidad del archivo importa tanto como el modelo que reconoce las palabras.",
    body: `
    <h2>Acerca el micrófono a quien habla</h2><p>Una voz lejana suele mezclarse con reverberación y sonidos del entorno. Coloca el micrófono a una distancia estable y haz una prueba corta antes de una entrevista o una clase.</p><p>Escucha esa prueba con audífonos. Si tú tienes dificultad para entender una frase, el reconocimiento también puede equivocarse.</p>
    <h2>Reduce el ruido en la fuente</h2><p>Busca un lugar tranquilo y evita colocar el micrófono cerca de ventiladores, teclados o superficies que transmitan golpes. Cerrar una ventana o cambiar de posición puede ayudar más que aumentar el volumen después.</p><p>Los filtros de reducción de ruido pueden mejorar algunas grabaciones, pero un ajuste agresivo puede eliminar partes de la voz. Conserva el original y compara el resultado escuchándolo.</p>
    <h2>Evita saturación y cambios bruscos de volumen</h2><p>Una voz distorsionada por una entrada demasiado alta pierde información. Bajar el volumen después no recupera las partes que se recortaron durante la grabación.</p><p>Intenta mantener una distancia parecida al micrófono durante toda la conversación y comprueba que tanto las voces fuertes como las suaves sean comprensibles.</p>
    <h2>Procura que hable una persona a la vez</h2><p>Cuando dos voces se superponen, el modelo puede omitir palabras o mezclarlas. En una entrevista, dejar una breve pausa antes de responder facilita escuchar y revisar el resultado.</p><p>VoxTexto no identifica automáticamente a cada participante en esta versión. Si necesitas un documento con nombres de hablantes, deberás añadirlos durante la edición.</p>
    <h2>Elige el idioma y revisa fragmentos difíciles</h2><p>Para una grabación en español con mucho ruido, seleccionar español manualmente evita depender de una identificación automática dudosa. Eso no garantiza recuperar palabras que no se distinguen.</p><p>Usa las marcas de tiempo para comparar el texto con el audio. Si una palabra sigue siendo ininteligible, es preferible marcarla como tal en el documento en lugar de asumir que la propuesta del modelo es correcta.</p>
    <h2>No conviertas formatos sin necesidad</h2><p>Renombrar una extensión no convierte un archivo. Si el navegador no puede abrirlo, utiliza una conversión real a WAV o MP3 con una herramienta que controles.</p><p>Convertir repetidamente entre formatos con pérdida puede degradar el sonido. Comprimir es útil para respetar el límite de 100 MB, pero conviene conservar una copia del archivo original.</p>
    <h2>Haz una revisión final</h2><p>Comprueba especialmente cifras, nombres y negaciones: una sola palabra puede cambiar el sentido de una frase. En usos sensibles, la transcripción automática debe tratarse como un borrador que requiere revisión.</p><p>La app permite editar el resultado y exportarlo; la claridad del documento final depende de esa comprobación.</p>
    <div class="related"><a href="/como-funciona/">Volver a la guía de transcripción →</a><a href="/guias/elegir-formato-de-transcripcion/">Elegir TXT, Word o PDF →</a></div>`,
  },
  {
    route: "/guias/elegir-formato-de-transcripcion/",
    title:
      "TXT, Word o PDF: qué formato elegir para tu transcripción | VoxTexto",
    description:
      "Compara los formatos de descarga de VoxTexto y elige cómo conservar, editar o compartir tu transcripción.",
    heading: "Elige el formato que sigue a tu conversación.",
    intro:
      "La misma transcripción puede convertirse en una nota sencilla, un documento editable o una copia para compartir.",
    body: `
    <h2>TXT: texto sencillo y fácil de reutilizar</h2><p>El archivo TXT conserva el contenido sin diseño de página. Puede abrirse con editores de texto y resulta práctico para copiar el resultado a otra aplicación.</p><p>VoxTexto genera TXT con codificación UTF-8 para conservar acentos y caracteres de distintos idiomas. Si una aplicación antigua muestra caracteres extraños, comprueba que esté interpretando el archivo como UTF-8.</p>
    <h2>Word: para seguir editando</h2><p>El formato DOCX permite trabajar después en un procesador de texto compatible. Es una buena opción si vas a añadir títulos, comentarios, nombres de participantes o una estructura más elaborada.</p><p>El texto mantiene sus caracteres Unicode, aunque su aspecto depende de las fuentes disponibles en el programa que lo abre. No necesitas tener Microsoft Word para generar el archivo desde VoxTexto.</p>
    <h2>PDF: para conservar una presentación de página</h2><p>El PDF es útil cuando quieres compartir una versión ya revisada con una disposición de páginas estable.</p><p>Para los alfabetos cubiertos por la fuente integrada, VoxTexto genera texto seleccionable. Para otros sistemas de escritura utiliza las fuentes del dispositivo y convierte las páginas en imágenes para evitar caracteres ausentes.</p><p>En esos PDF de imágenes no podrás seleccionar o buscar el texto de la misma manera. Si necesitas accesibilidad, búsqueda o edición posterior, conserva también un TXT o DOCX.</p>
    <h2>¿Conviene incluir marcas de tiempo?</h2><p>Actívalas si el documento servirá para volver a escuchar la grabación, revisar una entrevista o localizar una intervención. Puedes omitirlas cuando el objetivo sea leer un texto continuo.</p><p>Las marcas son referencias generadas durante el reconocimiento y pueden no coincidir exactamente con el inicio de cada palabra.</p>
    <div class="table-wrap"><table><thead><tr><th>Necesidad</th><th>Formato sugerido</th></tr></thead><tbody><tr><td>Copiar contenido a otras herramientas</td><td>TXT</td></tr><tr><td>Editar y dar formato después</td><td>Word / DOCX</td></tr><tr><td>Compartir una versión revisada</td><td>PDF</td></tr><tr><td>Conservar texto de distintos alfabetos</td><td>TXT o DOCX como copia adicional</td></tr></tbody></table></div>
    <h2>Antes de descargar</h2><p>Corrige el texto en el editor: el exportador utiliza la versión que aparece en tu sesión. Elige un nombre de archivo que te permita encontrarlo después y comprueba que el navegador haya terminado de guardarlo.</p><p>VoxTexto no mantiene una copia en una cuenta. La descarga es la forma de conservar tu trabajo.</p>`,
  },
  {
    route: "/preguntas-frecuentes/",
    title: "Preguntas frecuentes sobre transcripción local | VoxTexto",
    description:
      "Resuelve dudas sobre privacidad, idiomas, duración, formatos, instalación móvil y rendimiento de VoxTexto.",
    heading: "Lo que conviene saber antes de empezar.",
    intro:
      "Respuestas directas sobre el funcionamiento y los límites de la herramienta.",
    body: `
    <h2>¿Es gratis?</h2><p>La herramienta de esta versión puede utilizarse sin pagar y sin crear una cuenta. La conexión a internet, el dispositivo y su consumo de energía dependen de cada persona.</p>
    <h2>¿Mi audio se sube a un servidor?</h2><p>El código de VoxTexto procesa el audio y genera sus documentos en tu dispositivo. No envía las grabaciones ni las transcripciones a un servidor de reconocimiento.</p><p>La primera vez descarga archivos del modelo y del motor desde Hugging Face y su red de distribución. El alojamiento de la web y esos proveedores reciben las solicitudes normales de conexión, sin que VoxTexto les adjunte tu audio.</p>
    <h2>¿Puedo transcribir cualquier idioma?</h2><p>El motor multilingüe tiene un conjunto definido de idiomas compatibles. No cubre todos los idiomas del mundo y su precisión varía según el idioma, la grabación y las voces.</p>
    <h2>¿Traduce del español al inglés?</h2><p>No en esta versión: transcribe en el idioma original. Si el idioma identificado no coincide con la grabación, selecciónalo manualmente y vuelve a transcribir.</p>
    <h2>¿Por qué hay dos opciones de español?</h2><p>Permiten indicar una preferencia regional al editor. Latinoamérica y España utilizan el mismo reconocimiento de español; elegir una opción no transforma el vocabulario ni crea un modelo distinto.</p>
    <h2>¿Por qué tarda?</h2><p>El trabajo se realiza con el hardware de tu dispositivo. La primera descarga y los archivos largos pueden tardar, y la disponibilidad de aceleración depende del navegador y de la GPU.</p><p>Prueba el modo CPU si el modo automático falla. Para conocer el rendimiento de tu equipo, comienza con unos minutos de audio.</p>
    <h2>¿Funciona sin internet?</h2><p>La interfaz instalable puede abrirse sin conexión después de su primera carga. Para transcribir también se necesitan los archivos del modelo y del motor descargados previamente.</p><p>El navegador puede borrar cachés, por lo que no se garantiza una disponibilidad permanente sin conexión.</p>
    <h2>¿Puedo usarlo en un celular?</h2><p>Sí, en navegadores compatibles y con suficiente memoria. Puedes añadir la web a la pantalla de inicio. Para archivos largos, mantén la app abierta y evita bloquear la pantalla.</p>
    <h2>¿Se guardan mis cambios?</h2><p>El editor mantiene el texto durante la sesión, sin historial automático. Descárgalo antes de cerrar, recargar o iniciar otro trabajo.</p>
    <h2>¿Puede grabar una reunión?</h2><p>Esta versión pública trabaja con archivos de audio que tú seleccionas. No se conecta como bot a reuniones ni graba automáticamente llamadas.</p>
    <h2>¿Cómo obtengo ayuda?</h2>${contact}`,
  },
  {
    route: "/acerca/",
    title: "Acerca de VoxTexto | Transcripción local",
    description:
      "Conoce el propósito de VoxTexto, su enfoque de procesamiento local y los componentes abiertos que utiliza.",
    heading: "Una herramienta para trabajar con tus palabras.",
    intro:
      "VoxTexto busca que pasar una grabación a texto sea un proceso claro: seleccionar, revisar y descargar.",
    body: `
    <h2>El propósito del proyecto</h2><p>VoxTexto es un proyecto independiente de software para transcribir archivos de audio desde el navegador. Prioriza una interfaz sencilla y el procesamiento en el equipo de la persona que lo utiliza.</p><p>El sitio público se ofrece bajo la marca ${escape(config.brand)} y el dominio ${escape(origin.hostname)}. La herramienta no requiere una cuenta para convertir y exportar audio.</p>
    <h2>Qué desarrollamos y qué componentes utilizamos</h2><p>La interfaz, el flujo de edición, la detección de idioma integrada, la validación de archivos y la exportación forman parte de la aplicación.</p><p>El reconocimiento utiliza Whisper Base, un modelo abierto de OpenAI, convertido a ONNX por onnx-community y ejecutado con Transformers.js. VoxTexto no afirma haber entrenado ese modelo y no es un producto oficial de OpenAI ni de Hugging Face.</p>
    <h2>Un resultado que se puede revisar</h2><p>La transcripción automática no sustituye escuchar una grabación cuando su contenido es importante. Por eso la herramienta muestra segmentos, permite volver al audio y deja editar las palabras antes de exportar.</p><p>Los límites actuales son 60 minutos y 100 MB por archivo, sujetos también a los recursos del dispositivo.</p>
    <h2>Disponibilidad</h2><p>Esta es una versión inicial de la web. La instalación desde navegadores compatibles facilita abrirla desde el celular o la computadora.</p><p>La grabación de audio del sistema y la integración de bots de reuniones no forman parte de esta entrega pública.</p>
    <h2>Licencias y créditos</h2><p>Whisper se distribuye bajo MIT y Transformers.js bajo Apache-2.0. La aplicación también utiliza React, Tauri, Lucide, docx y pdfmake con sus respectivas licencias.</p><p>Los créditos completos de las dependencias y los textos de licencia incluidos en esta distribución están disponibles en <a href="/licencias.txt">licencias y atribuciones</a>.</p>`,
  },
  {
    route: "/privacidad/",
    title: "Privacidad y datos locales | VoxTexto",
    description:
      "Conoce qué procesa VoxTexto, qué permanece en tu dispositivo y qué conexiones son necesarias para utilizar el servicio.",
    heading: "Privacidad y uso de datos.",
    intro:
      "Esta página describe el funcionamiento de la versión publicada y las conexiones que necesita.",
    body: `
    <p class="updated">Última actualización del contenido: ${escape(config.contentUpdated)}.</p>
    <h2>Quién ofrece el servicio</h2><p>El servicio se presenta bajo el nombre ${operator}, en ${escape(origin.hostname)}.</p>${contact}
    <h2>Grabaciones y transcripciones</h2><p>El archivo de audio que seleccionas se lee desde tu dispositivo. El código de VoxTexto realiza allí el reconocimiento, la edición y la generación de documentos.</p><p>No contamos con un servidor para recibir tus grabaciones o guardar un historial de transcripciones. El contenido de la sesión se mantiene en memoria hasta que cierres, recargues o reinicies el trabajo.</p><p>Si decides descargar un documento, el archivo queda donde tú y tu navegador elijan guardarlo. VoxTexto no controla las copias que posteriormente compartas o sincronices con otras aplicaciones.</p>
    <h2>Descarga del modelo</h2><p>Para ejecutar el reconocimiento se descargan archivos públicos del modelo y del motor desde Hugging Face y sus proveedores de distribución. Pueden recibir la dirección IP y los datos técnicos habituales de esas solicitudes.</p><p>El código de VoxTexto no adjunta tu audio ni tu transcripción a esas descargas.</p>
    <h2>Alojamiento de la web</h2><p>El proveedor de alojamiento recibe las solicitudes necesarias para servir las páginas y sus recursos. Puede gestionar registros técnicos de acceso, como IP, fecha, navegador y ruta solicitada, de acuerdo con su configuración y políticas.</p><p>Estos registros de conexión no son un historial de los audios ni del texto que editas en la herramienta.</p>
    <h2>Almacenamiento local</h2><p>Guardamos únicamente tu preferencia de modo claro u oscuro en el almacenamiento local del navegador. Puedes cambiarla con el botón de apariencia o eliminarla al borrar los datos del sitio. Sin una elección guardada, se utiliza la apariencia de tu dispositivo.</p><p>La web instalable puede conservar su interfaz y recursos estáticos mediante un service worker. La biblioteca de reconocimiento puede conservar el modelo en una caché independiente.</p><p>Estas cachés no están diseñadas para guardar tus audios o tus transcripciones. Puedes eliminarlas desde los ajustes de datos del sitio en tu navegador; eso puede obligar a descargar de nuevo el modelo.</p>
    <h2>Publicidad y medición</h2><p>El paquete inicial no carga AdSense ni herramientas de analítica. No contiene un identificador publicitario de editor.</p><p>Si se incorpora publicidad, esta página deberá actualizarse antes de activarla y deberán configurarse los avisos y mecanismos de consentimiento correspondientes. Los anuncios no se incorporan al editor de audios y transcripciones en este paquete.</p>
    <h2>Opciones de control</h2><p>Puedes cancelar una transcripción, cerrar la sesión y eliminar los datos del sitio desde tu navegador. Cerrar la app no elimina las copias que hayas descargado.</p><p>Utiliza grabaciones que tengas derecho a procesar y evita compartir documentos con información de otras personas sin la autorización correspondiente.</p>
    <h2>Más información</h2><p>Consulta los <a href="/terminos/">términos de uso</a> y la <a href="/como-funciona/">guía de funcionamiento</a> para conocer los límites de esta versión.</p>`,
  },
  {
    route: "/terminos/",
    title: "Términos de uso de la herramienta | VoxTexto",
    description:
      "Condiciones de uso de VoxTexto, límites de la transcripción automática y responsabilidad sobre los archivos procesados.",
    heading: "Términos de uso.",
    intro: "Utiliza la herramienta conociendo su propósito y sus límites.",
    body: `
    <p class="updated">Última actualización del contenido: ${escape(config.contentUpdated)}.</p>
    <h2>Servicio ofrecido</h2><p>VoxTexto permite seleccionar un archivo de audio, generar una transcripción automática en tu dispositivo, editarla y descargarla. La versión actual se ofrece sin cobro por utilizar la herramienta.</p><p>No se garantiza disponibilidad continua, rendimiento en cualquier equipo ni reconocimiento exacto de todas las voces e idiomas.</p>
    <h2>Uso de grabaciones</h2><p>Debes contar con los permisos necesarios para procesar los archivos que seleccionas y respetar la privacidad de las personas que aparecen en ellos.</p><p>La herramienta no otorga derechos sobre contenido ajeno ni convierte una grabación en material de libre distribución.</p>
    <h2>Revisión del resultado</h2><p>El modelo puede omitir palabras, introducir otras o equivocarse con nombres, cifras y frases. Revisa el resultado escuchando el audio antes de utilizarlo o compartirlo.</p><p>En contextos médicos, legales, académicos o laborales sensibles, no debe tratarse una salida automática sin revisión como un registro fiel o certificado.</p>
    <h2>Límites técnicos</h2><p>Se admiten archivos de hasta 60 minutos y 100 MB, además de las limitaciones del navegador y el dispositivo. Puede ser necesario descargar componentes adicionales y mantener la app en primer plano.</p><p>La exportación a PDF de ciertos alfabetos utiliza páginas de imagen y depende de las fuentes del sistema. Conserva TXT o DOCX si necesitas texto seleccionable o editable.</p>
    <h2>Conservación de tu trabajo</h2><p>El texto permanece durante la sesión y no se almacena en una cuenta de VoxTexto. Es tu responsabilidad descargarlo si quieres conservarlo.</p>
    <h2>Componentes abiertos y derechos</h2><p>El software incorpora dependencias con sus propias licencias. Las marcas mencionadas pertenecen a sus titulares; su uso como crédito no implica patrocinio o afiliación.</p>
    <h2>Cambios del servicio</h2><p>Las funciones y límites pueden evolucionar. Los cambios relevantes de funcionamiento y tratamiento de datos deben reflejarse en las páginas del servicio.</p><p>Estos términos no pretenden excluir derechos que resulten obligatorios según la normativa aplicable.</p>
    <h2>Ayuda</h2>${contact}`,
  },
];

function layout(page, body, noindex = false) {
  const canonical = url(page.route);
  const schema = page.home
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            name: config.brand,
            url: url("/"),
            inLanguage: "es",
          },
          {
            "@type": "WebApplication",
            name: config.brand,
            url: url("/app/"),
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Navegador web compatible",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            description: page.description,
          },
        ],
      }
    : {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: page.title,
        description: page.description,
        url: canonical,
        inLanguage: "es",
      };
  return `<!doctype html><html lang="es-419"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.title)}</title><meta name="description" content="${escape(page.description)}"><meta name="robots" content="${noindex ? "noindex,follow" : "index,follow,max-image-preview:large"}"><link rel="canonical" href="${canonical}"><meta name="theme-color" content="#594ad8"><link rel="icon" href="/recursos/favicon.svg" type="image/svg+xml"><script src="/recursos/theme.js"></script><link rel="stylesheet" href="/recursos/site.css"><meta property="og:type" content="website"><meta property="og:locale" content="es_LA"><meta property="og:site_name" content="${escape(config.brand)}"><meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${url("/recursos/compartir.png")}"><meta name="twitter:card" content="summary_large_image">${config.googleSiteVerification ? `<meta name="google-site-verification" content="${escape(config.googleSiteVerification)}">` : ""}${config.adsensePublisherId ? `<meta name="google-adsense-account" content="ca-${escape(config.adsensePublisherId)}">` : ""}<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script></head><body><a class="skip" href="#contenido">Saltar al contenido</a><header><div class="nav"><a class="brand" href="/" aria-label="VoxTexto, inicio"><img src="/recursos/favicon.svg" width="37" height="37" alt="">VoxTexto<b>.</b></a><nav aria-label="Navegación principal"><a href="/como-funciona/">Cómo funciona</a><a href="/preguntas-frecuentes/">Preguntas frecuentes</a><a class="nav-blog" href="${escape(blogUrl.href)}" target="_blank" rel="noopener noreferrer" aria-label="Blog de ciberseguridad (abre en otra pestaña)">Blog de ciberseguridad ↗</a><button class="theme-toggle" type="button" data-theme-toggle aria-label="Cambiar modo claro u oscuro" title="Cambiar modo claro u oscuro"><svg class="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.9 13a9 9 0 0 1-9.9-9.9A9 9 0 1 0 20.9 13Z"/></svg><svg class="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg></button>${button}</nav></div></header>${body}<footer class="footer"><span>© 2026 ${escape(config.brand)} · Dale espacio a tus palabras.</span><nav aria-label="Información del sitio"><a href="/acerca/">Acerca del proyecto</a><a href="/privacidad/">Privacidad</a><a href="/terminos/">Términos</a><a class="nav-blog" href="${escape(blogUrl.href)}" target="_blank" rel="noopener noreferrer" aria-label="Blog de ciberseguridad (abre en otra pestaña)">Blog de ciberseguridad ↗</a>${config.contactEmail ? `<a href="mailto:${escape(config.contactEmail)}">Contacto</a>` : ""}</nav></footer></body></html>`;
}

function home() {
  const wave = Array.from(
    { length: 34 },
    (_, i) => `<i style="height:${8 + ((i * 17 + 13) % 23)}px"></i>`,
  ).join("");
  return `<main id="contenido"><section class="hero"><div><p class="eyebrow">Tu voz, bajo tu control</p><h1>Del audio al texto.<br><em>Y a lo que sigue.</em></h1><p class="lead">Transcribe tus grabaciones, revisa cada palabra y descarga el resultado. Un espacio sencillo para trabajar con tus ideas, en tu propio dispositivo.</p><div class="hero-actions">${button}<a class="button secondary" href="/como-funciona/">Conocer cómo funciona</a></div><p class="micro"><i></i> Gratis · Sin cuentas · Hasta 60 minutos y 100 MB</p></div><div><div class="document-preview" aria-label="Ejemplo ilustrativo de una transcripción"><div class="preview-top"><span>Tus palabras</span><span class="pill">Ejemplo ilustrativo</span></div><div class="preview-audio"><span class="play" aria-hidden="true">▶</span><span class="wave" aria-hidden="true">${wave}</span><small>00:22</small></div><div class="preview-line"><time>00:00</time><span>Las buenas ideas a veces empiezan con una conversación.</span></div><div class="preview-line"><time>00:07</time><span>Una nota de voz, una entrevista o algo que no quieres olvidar.</span></div><div class="preview-line"><time>00:15</time><span>Tú decides qué palabras conservar.</span></div><div class="preview-footer">Escucha. Revisa. Guarda.<span>TXT &nbsp; DOCX &nbsp; PDF</span></div></div><p class="preview-caption">Vista ilustrativa. La herramienta incluye un ejemplo editable.</p></div></section>
  <section class="section"><p class="eyebrow">Tres pasos, sin complicaciones</p><h2>Menos transcribir. Más crear.</h2><p class="section-intro">Convierte una grabación en un borrador que puedes escuchar, revisar y llevar a donde lo necesites.</p><div class="cards"><article class="card"><span class="number">01 / SELECCIONA</span><h3>Tu audio, desde tu equipo.</h3><p>Elige un archivo de hasta una hora y selecciona su idioma, o utiliza la detección automática.</p></article><article class="card"><span class="number">02 / REVISA</span><h3>Vuelve a escuchar cada idea.</h3><p>Usa las marcas de tiempo, corrige nombres y ajusta las palabras directamente en el editor.</p></article><article class="card"><span class="number">03 / DESCARGA</span><h3>Un texto que sigue contigo.</h3><p>Guarda el resultado como nota sencilla, documento editable o PDF listo para compartir.</p></article></div></section>
  <section class="soft-section"><div class="section split"><div><p class="eyebrow">Procesamiento local</p><h2>La grabación se queda en tu dispositivo.</h2></div><div><p>VoxTexto descarga un modelo de reconocimiento y lo ejecuta en tu equipo. El código de la app no sube tu audio ni tu transcripción a un servidor.</p><p>La primera descarga requiere internet. La velocidad y la memoria dependen de tu navegador y del dispositivo; la transcripción automática siempre debe revisarse.</p><a class="inline-link" href="/privacidad/">Conocer el funcionamiento y los datos →</a></div></div></section>
  <section class="section"><p class="eyebrow">Antes de comenzar</p><h2>Haz espacio para un mejor resultado.</h2><div class="cards"><article class="card"><span class="number">GUÍA DE USO</span><h3>Tu primera transcripción.</h3><p>Qué esperar de la descarga inicial, cómo elegir el idioma y cómo conservar el resultado.</p><a href="/como-funciona/">Ver el paso a paso →</a></article><article class="card"><span class="number">CALIDAD DEL AUDIO</span><h3>Una voz más clara.</h3><p>Consejos para grabar con menos ruido y revisar los fragmentos que no se entienden.</p><a href="/guias/mejorar-calidad-del-audio/">Preparar tu grabación →</a></article><article class="card"><span class="number">FORMATOS</span><h3>TXT, Word o PDF.</h3><p>Elige cómo editar, conservar y compartir tu texto según lo que quieras hacer después.</p><a href="/guias/elegir-formato-de-transcripcion/">Comparar las descargas →</a></article></div></section>
  <section class="section" style="padding-top:0"><h2>Preguntas frecuentes.</h2><details><summary>¿Necesito crear una cuenta?</summary><p>No. Puedes seleccionar tu audio y comenzar desde un navegador compatible.</p></details><details><summary>¿Todos los idiomas tienen la misma precisión?</summary><p>No. El motor es multilingüe, pero la precisión varía por idioma y por las condiciones de la grabación. Puedes escoger el idioma manualmente y corregir el resultado.</p></details><details><summary>¿Puedo usarlo en mi celular?</summary><p>Sí, en navegadores compatibles y con suficiente memoria. La web se puede añadir a la pantalla de inicio. Mantén la app abierta durante la transcripción.</p></details><details><summary>¿El texto se guarda automáticamente?</summary><p>No se conserva un historial en una cuenta. Descarga tu trabajo antes de cerrar o recargar la sesión.</p></details><p><a class="inline-link" href="/preguntas-frecuentes/">Leer todas las respuestas →</a></p></section>
  <section class="section" style="padding-top:0"><div class="cta"><div><h2>Tu próxima idea ya tiene voz.</h2><p>Empieza con un audio corto o explora el ejemplo del editor.</p></div>${button}</div></section></main>`;
}

await mkdir(path.join(output, "recursos"), { recursive: true });
await copyFile(
  path.join(root, "site/site.css"),
  path.join(output, "recursos/site.css"),
);
await copyFile(
  path.join(root, "public/favicon.svg"),
  path.join(output, "recursos/favicon.svg"),
);
for (const [source, target] of [
  ["@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2", "dm-sans.woff2"],
  [
    "@fontsource/dm-sans/files/dm-sans-latin-600-normal.woff2",
    "dm-sans-semibold.woff2",
  ],
  ["@fontsource/manrope/files/manrope-latin-700-normal.woff2", "manrope.woff2"],
])
  await copyFile(
    path.join(root, "node_modules", source),
    path.join(output, "recursos", target),
  );
await copyFile(
  path.join(root, "site/compartir.png"),
  path.join(output, "recursos/compartir.png"),
);
await copyFile(path.join(root, "public/theme.js"), path.join(output, "recursos/theme.js"));
for (const page of pages) {
  const directory = path.join(output, page.route);
  await mkdir(directory, { recursive: true });
  const body = page.home
    ? home()
    : `<main id="contenido" class="content"><div class="breadcrumb"><a href="/">VoxTexto</a> / ${escape(page.heading)}</div><h1>${escape(page.heading)}</h1><p class="intro">${escape(page.intro)}</p>${page.body}<div class="related">${button}</div></main>`;
  await writeFile(path.join(directory, "index.html"), layout(page, body));
}
await writeFile(
  path.join(output, "404.html"),
  layout(
    {
      route: "/404.html",
      title: "Página no encontrada | VoxTexto",
      description: "La página solicitada no existe.",
    },
    '<main id="contenido" class="content"><p class="eyebrow">404</p><h1>Esta página no está aquí.</h1><p>Vuelve al inicio para encontrar la herramienta y sus guías.</p><a class="button" href="/">Volver al inicio</a></main>',
    true,
  ),
);
await writeFile(
  path.join(output, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${url("/sitemap.xml")}\n`,
);
await writeFile(
  path.join(output, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url><loc>${escape(url(page.route))}</loc><lastmod>${escape(config.contentUpdated)}</lastmod></url>`).join("\n")}\n</urlset>\n`,
);
await writeFile(
  path.join(output, "ads.txt"),
  config.adsensePublisherId
    ? `google.com, ${config.adsensePublisherId}, DIRECT, f08c47fec0942fa0\n`
    : "# No se han declarado vendedores publicitarios autorizados.\n# AdSense no esta activado en esta publicacion.\n",
);
await copyFile(
  path.join(root, "site/root.htaccess"),
  path.join(output, ".htaccess"),
);
await copyFile(
  path.join(root, "site/app.htaccess"),
  path.join(output, "app/.htaccess"),
);
let app = await readFile(path.join(output, "app/index.html"), "utf8");
app = app.replace(
  "</head>",
  `<meta name="robots" content="noindex,follow"><link rel="canonical" href="${url("/app/")}"></head>`,
);
await writeFile(path.join(output, "app/index.html"), app);
const dependencyLicenses = [
  "react/LICENSE",
  "react-dom/LICENSE",
  "@huggingface/transformers/LICENSE",
  "onnxruntime-web/LICENSE",
  "docx/LICENSE",
  "pdfmake/LICENSE",
  "lucide-react/LICENSE",
  "@fontsource/dm-sans/LICENSE",
  "@fontsource/manrope/LICENSE",
];
let licenses =
  (await readFile(path.join(root, "LICENSE"), "utf8")) +
  "\n\n" +
  (await readFile(path.join(root, "THIRD_PARTY_NOTICES.md"), "utf8"));
for (const file of dependencyLicenses) {
  try {
    licenses +=
      `\n\n===== ${file} =====\n` +
      (await readFile(path.join(root, "node_modules", file), "utf8"));
  } catch {
    /* Third-party notices retain the authoritative source links. */
  }
}
await writeFile(path.join(output, "licencias.txt"), licenses);
console.log(
  `Publicación preparada: ${pages.length} páginas indexables, app en /app/, robots.txt y sitemap.xml para ${origin.hostname}.`,
);
if (!config.contactEmail || !config.operatorLegalName)
  console.log(
    "Pendiente del titular: completar responsable y correo operativo antes de solicitar AdSense.",
  );
if (!config.adsensePublisherId)
  console.log(
    "AdSense permanece desactivado. No se han inventado códigos de editor ni de verificación.",
  );

