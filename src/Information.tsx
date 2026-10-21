export default function Information() {
  return (
    <div className="help-content">
      <h3>¿A dónde va mi audio?</h3>
      <p>Se lee y procesa en tu dispositivo.</p>
      <p>
        VoxTexto no lo envía a un servidor de transcripción, no requiere cuenta
        y no guarda historial.
      </p>
      <p>El texto permanece en memoria hasta cerrar o reiniciar esta sesión.</p>
      <h3>¿Necesito internet?</h3>
      <p>
        La primera vez se descargan archivos del modelo y del motor desde
        Hugging Face y su red de distribución.
      </p>
      <p>Esos proveedores reciben solicitudes de descarga, pero no tu audio.</p>
      <p>
        El navegador puede conservar el modelo en caché; eso no equivale a
        guardar tus grabaciones.
      </p>
      <p>
        La app instalada puede abrirse sin conexión después de cargarla, pero
        transcribir sin internet requiere haber descargado antes el modelo y el
        motor.
      </p>
      <h3>Idiomas y precisión</h3>
      <p>Usamos Whisper Base multilingüe a través de Transformers.js.</p>
      <p>
        La detección automática analiza muestras del audio; no utiliza el idioma
        de Windows ni del navegador.
      </p>
      <p>
        Si la detección es dudosa o ya conoces el idioma, selecciónalo
        manualmente.
      </p>
      <p>
        Español latinoamericano y español de España comparten el mismo modelo de
        reconocimiento.
      </p>
      <p>
        La preferencia regional ajusta la revisión ortográfica del editor, sin
        traducir ni sustituir tus expresiones.
      </p>
      <p>No todos los idiomas tienen la misma precisión.</p>
      <p>
        Puede cometer errores, especialmente con ruido, silencios, nombres
        propios o voces superpuestas.
      </p>
      <p>Escucha y revisa antes de compartir.</p>
      <h3>Descargas y alfabetos</h3>
      <p>TXT y Word conservan texto Unicode.</p>
      <p>
        Para alfabetos que la fuente del PDF no cubre, usamos las fuentes de tu
        sistema y generamos páginas como imágenes.
      </p>
      <p>En esos PDF el texto no es seleccionable.</p>
      <p>Para conservar texto editable, elige Word o TXT.</p>
      <h3>¿Por qué hay límites?</h3>
      <p>Admitimos hasta 60 minutos y 100 MB.</p>
      <p>La velocidad y memoria disponible dependen de tu dispositivo.</p>
      <p>Recomendamos comenzar con un audio corto.</p>
      <p>Los formatos compatibles dependen del navegador.</p>
      <h3>Celular y escritorio</h3>
      <p>
        Puedes instalar la versión web desde un navegador compatible, sin pasar
        por una tienda de aplicaciones.
      </p>
      <p>
        En el celular, mantén la app abierta durante la transcripción: el
        sistema puede pausarla en segundo plano.
      </p>
      <h3>Créditos</h3>
      <p>VoxTexto tiene interfaz y lógica de aplicación propias.</p>
      <p>
        El reconocimiento utiliza el modelo abierto{" "}
        <a
          href="https://github.com/openai/whisper"
          target="_blank"
          rel="noreferrer"
        >
          Whisper de OpenAI
        </a>{" "}
        (MIT), convertido a ONNX por onnx-community, y{" "}
        <a
          href="https://github.com/huggingface/transformers.js"
          target="_blank"
          rel="noreferrer"
        >
          Transformers.js
        </a>{" "}
        (Apache-2.0).
      </p>
      <p>No es un producto oficial de OpenAI ni de Hugging Face.</p>
    </div>
  );
}
