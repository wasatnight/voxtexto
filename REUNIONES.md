# Reuniones: opciones para una fase posterior

Revisión de documentación oficial: 20 de octubre de 2026. Este documento describe viabilidad; no contiene una integración ni un bot activo.

Las plataformas a integrar serían Google Meet y Microsoft Teams.

## Primera opción: captura local de una reunión en el navegador

Una función futura podría permitir que la persona seleccione la pestaña de su reunión y active explícitamente la captura de su audio. Habría que mezclar el sonido de la pestaña con el micrófono para incluir la voz de quien está usando VoxTexto; capturar solo la pestaña puede omitir su propia intervención.

La grabación se mantendría en el dispositivo durante la sesión y luego se transcribiría con el editor actual. Podría ofrecerse guardar el audio localmente, por decisión explícita de la persona. La app mostraría un estado de grabación visible y la persona avisaría a los participantes antes de grabar.

Esto conserva la arquitectura sin servidor de transcripción, pero no es un participante autónomo que se una por un enlace. Requiere que la persona esté presente, seleccione qué compartir y mantenga el equipo funcionando. Se conservaría inicialmente el límite de 60 minutos.

`getDisplayMedia` requiere un contexto seguro y selección del usuario. La disponibilidad de audio depende del navegador, del sistema y del tipo de superficie compartida; no se puede prometer grabación completa de otras apps desde móviles. Fuente: [MDN, getDisplayMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia).

## Bot autónomo en Google Meet

La Meet Media API permite consumir audio en tiempo real con autorización de la reunión, pero su documentación actual indica que el programa de vista previa ya no acepta nuevas inscripciones. No debemos anunciar que podemos conectar cualquier cuenta o reunión sin comprobar elegibilidad y permisos. El SDK de complementos de Meet no equivale por sí mismo a acceso libre al audio de participantes.

Fuente: [Google Meet Media API](https://developers.google.com/workspace/meet/media-api/guides/overview).

## Bot autónomo en Microsoft Teams

El acceso al audio en bruto mediante un bot con medios alojados por la aplicación requiere .NET/C#, permisos de Microsoft Graph y una infraestructura compatible. La documentación de producción exige Windows Server en Azure. El bot debe comunicar el comienzo de la grabación mediante `updateRecordingStatus` y recibir éxito antes de persistir el contenido o sus derivados.

Una base de datos no es una obligación universal para todo bot, pero este enfoque sí exige un backend accesible, registro de aplicaciones, credenciales y costes de operación potenciales. No se resuelve con un botón en el frontend estático.

Fuentes: [Requisitos de bots con medios alojados](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/requirements-considerations-application-hosted-media-bots), [Microsoft Graph: alojamiento de medios y estado de grabación](https://learn.microsoft.com/en-us/graph/cloud-communications-media).

## Alternativa: importar una grabación ya obtenida

El flujo actual ya acepta un archivo de audio que la persona haya obtenido legítimamente de su reunión. Las API de transcripciones de cada plataforma podrían estudiarse después, según la cuenta, licencias, permisos y disponibilidad de los registros. Eso sería importar contenido existente, no escuchar toda la llamada con un bot propio.

La recomendación para mantener el proyecto sencillo y sin costes de procesamiento en servidores es comenzar por captura local en computadora, con las limitaciones anteriores, antes de invertir en un bot autónomo.
