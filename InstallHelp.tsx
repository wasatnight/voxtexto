import { useEffect, useRef } from "react";
import { Check, Smartphone, X } from "lucide-react";

export default function InstallHelp({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="help-dialog install-dialog"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="dialog-heading">
        <span className="brand-icon">
          <Smartphone size={23} />
        </span>
        <h2>VoxTexto, a la mano.</h2>
        <button
          className="icon-button"
          aria-label="Cerrar instalación"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <div className="help-content">
        <h3>Android</h3>
        <p>
          Abre el menú de tu navegador y elige «Instalar aplicación» o «Agregar
          a pantalla principal».
        </p>
        <h3>iPhone y iPad</h3>
        <p>
          Abre VoxTexto en Safari, pulsa Compartir y selecciona «Agregar a
          pantalla de inicio».
        </p>
        <p>Si aparece la opción, activa «Abrir como app web».</p>
        <h3>Computadora</h3>
        <p>
          En Chrome o Edge, busca «Instalar VoxTexto» en la barra de direcciones
          o en el menú del navegador.
        </p>
        <h3>Para probar desde el celular</h3>
        <p>Necesitas abrir una dirección HTTPS publicada.</p>
        <p>
          La dirección 127.0.0.1 de esta prueba solo funciona en el equipo que
          ejecuta VoxTexto.
        </p>
        <h3>Antes de una transcripción larga</h3>
        <p>
          El audio se procesa con la memoria y la batería de tu dispositivo.
        </p>
        <p>
          Mantén la app abierta: el sistema puede pausar el procesamiento en
          segundo plano o al bloquear la pantalla.
        </p>
      </div>
      <button className="button primary dialog-close" onClick={onClose}>
        Entendido <Check size={16} />
      </button>
    </dialog>
  );
}
