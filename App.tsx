import { useEffect, useRef, useState } from "react";
import {
  AudioLines,
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Copy,
  FileAudio,
  FileText,
  Headphones,
  LoaderCircle,
  LockKeyhole,
  Monitor,
  Moon,
  Sun,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type {
  Engine,
  Phase,
  Segment,
  WorkerRequest,
  WorkerResponse,
} from "./types";
import { decodeAudio, readDuration } from "./lib/audio";
import {
  fileStem,
  formatTime,
  transcriptText,
  validateFile,
  wordCount,
} from "./lib/transcript";
import { languages } from "./lib/languages";
import { saveExport, type ExportFormat } from "./lib/export";
import { demoSegments } from "./lib/demo";
import SegmentEditor from "./SegmentEditor";
import Information from "./Information";
import InstallHelp from "./InstallHelp";
import LanguageSelect from "./LanguageSelect";
import Recorder from "./Recorder";
import { useInstall } from "./useInstall";

function displayLanguage(value: string) {
  const option = languages.find(([code]) => code === value);
  if (option) return option[1];
  try {
    return (
      new Intl.DisplayNames(["es-419"], { type: "language" }).of(value) ?? value
    );
  } catch {
    return value;
  }
}

const runningPhases: Phase[] = [
  "reading",
  "decoding",
  "loading",
  "detecting",
  "transcribing",
];

export default function App() {
  const installation = useInstall();
  const [phase, setPhase] = useState<Phase>("empty");
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [language, setLanguage] = useState("auto");
  const [engine, setEngine] = useState<Engine>("auto");
  const [engineLabel, setEngineLabel] = useState("");
  const [usedLanguage, setUsedLanguage] = useState<{
    language: string;
    automatic: boolean;
    uncertain: boolean;
  } | null>(null);
  const pendingLanguage = useRef<typeof usedLanguage>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [timestamps, setTimestamps] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("txt");
  const [exporting, setExporting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const worker = useRef<Worker | null>(null);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const player = useRef<HTMLAudioElement>(null);
  const help = useRef<HTMLDialogElement>(null);
  const busy = runningPhases.includes(phase);
  const hasText = segments.some((s) => s.text.trim());

  useEffect(
    () => () => {
      worker.current?.terminate();
      controller.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (!audioUrl) return;
    return () => URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty || busy || capturing) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy, capturing]);
  useEffect(() => {
    if (showHelp) help.current?.showModal();
    else help.current?.close();
  }, [showHelp]);

  function stop() {
    generation.current++;
    controller.current?.abort();
    worker.current?.terminate();
    worker.current = null;
    setPhase(file ? "ready" : "empty");
    setProgress(0);
    setMessage("");
    setNotice("Proceso cancelado. Puedes volver a intentarlo.");
  }

  function canReplace() {
    return (
      !dirty ||
      window.confirm(
        "El audio y el texto solo están en esta sesión. Guarda lo que quieras conservar antes de continuar. ¿Quieres descartarlos?",
      )
    );
  }

  function clear() {
    if (!canReplace()) return;
    player.current?.pause();
    stop();
    setUsedLanguage(null);
    pendingLanguage.current = null;
    setEngineLabel("");
    setRate(1);
    setFile(null);
    setRecorded(false);
    setAudioUrl("");
    setDuration(0);
    setSegments([]);
    setIsDemo(false);
    setPhase("empty");
    setError("");
    setNotice("");
    setDirty(false);
    setCurrentTime(0);
    setPlaying(false);
    if (input.current) input.current.value = "";
  }

  async function selectFile(selected?: File, recordedSeconds?: number) {
    if (!selected || busy) return;
    setError("");
    setNotice("");
    try {
      validateFile(selected);
    } catch (error) {
      setError((error as Error).message);
      return;
    }
    if (recordedSeconds === undefined && !canReplace()) return;
    const job = ++generation.current;
    setPhase("reading");
    const url = URL.createObjectURL(selected);
    try {
      const seconds = recordedSeconds ?? await readDuration(url);
      if (job !== generation.current) {
        URL.revokeObjectURL(url);
        return;
      }
      setFile(selected);
      setRecorded(recordedSeconds !== undefined);
      setAudioUrl(url);
      setDuration(seconds);
      setSegments([]);
      setIsDemo(false);
      setDirty(recordedSeconds !== undefined);
      setCurrentTime(0);
      setPlaying(false);
      setPhase("ready");
    } catch (error) {
      URL.revokeObjectURL(url);
      if (job === generation.current) {
        setError((error as Error).message);
        setPhase(file ? "ready" : isDemo ? "done" : "empty");
      }
    }
  }

  function loadDemo() {
    if (busy || !canReplace()) return;
    setFile(null);
    setRecorded(false);
    setAudioUrl("");
    setDuration(22);
    setSegments(demoSegments.map((s) => ({ ...s })));
    setIsDemo(true);
    setPhase("done");
    setError("");
    setNotice(
      "Ejemplo de edición: este texto no se ha generado a partir de un audio.",
    );
    setDirty(false);
    setCurrentTime(0);
    setPlaying(false);
  }

  async function transcribe() {
    if (!file || busy) return;
    if (
      hasText &&
      !window.confirm(
        "Una nueva transcripción reemplazará el texto actual. ¿Continuar?",
      )
    )
      return;
    const job = ++generation.current;
    controller.current = new AbortController();
    setError("");
    setNotice("");
    setProgress(0);
    setPhase("decoding");
    setMessage("Preparando tu audio…");
    try {
      const audio = await decodeAudio(file, controller.current.signal);
      if (job !== generation.current) return;
      setPhase("loading");
      setMessage("Iniciando el motor de voz…");
      const instance = new Worker(
        new URL("./transcription.worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.current = instance;
      instance.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
        if (job !== generation.current) return;
        if (data.type === "language") {
          pendingLanguage.current = data;
        } else if (data.type === "status") {
          setMessage(data.message);
          if (data.engine) setEngineLabel(data.engine);
          if (data.message.startsWith("Transcribiendo")) {
            setPhase("transcribing");
            setProgress(0);
          }
          if (data.message.startsWith("Detectando")) setPhase("detecting");
        } else if (data.type === "download") {
          setMessage(
            `Descargando ${data.file.split("/").pop()} · ${Math.floor(data.progress)} %`,
          );
        } else if (data.type === "progress") setProgress(data.progress);
        else if (data.type === "complete") {
          setUsedLanguage(pendingLanguage.current);
          setSegments(data.segments);
          setPhase("done");
          setProgress(100);
          setEngineLabel(data.engine);
          setDirty(data.segments.length > 0);
          setNotice(
            data.segments.length
              ? "Transcripción lista. Revisa el texto antes de descargarlo."
              : "No se detectó voz. Revisa el audio o selecciona el idioma manualmente.",
          );
          instance.terminate();
          worker.current = null;
        } else if (data.type === "error") {
          setPhase("ready");
          setError(
            data.message.includes("manualmente")
              ? data.message
              : "No pudimos completar la transcripción. Comprueba tu conexión para descargar el modelo, prueba el modo CPU o usa un audio más corto.",
          );
          instance.terminate();
          worker.current = null;
        }
      };
      instance.onerror = () => {
        if (job !== generation.current) return;
        setPhase("ready");
        setError(
          "El motor de voz no pudo iniciarse. Prueba el modo CPU y un navegador actualizado.",
        );
        instance.terminate();
        worker.current = null;
      };
      const request: WorkerRequest = { audio, language, engine };
      instance.postMessage(request, [audio.buffer]);
    } catch (error) {
      if (job !== generation.current) return;
      setPhase("ready");
      setError((error as Error).message);
    }
  }

  function editSegment(id: string, text: string) {
    setSegments((previous) =>
      previous.map((segment) =>
        segment.id === id ? { ...segment, text } : segment,
      ),
    );
    setDirty(true);
  }
  function seek(time: number) {
    if (player.current) {
      player.current.currentTime = time;
      setCurrentTime(time);
    }
  }
  async function togglePlay() {
    const audio = player.current;
    if (!audio) return;
    try {
      if (audio.paused) await audio.play();
      else audio.pause();
    } catch {
      setError("No se pudo reproducir este formato. Prueba con MP3 o WAV.");
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(transcriptText(segments, timestamps));
      setNotice("Texto copiado.");
    } catch {
      setError(
        "No pudimos copiar el texto. Puedes seleccionarlo o descargarlo en TXT.",
      );
    }
  }
  async function download() {
    setExporting(true);
    setError("");
    try {
      const saved = await saveExport(
        format,
        segments,
        isDemo ? "ejemplo-voxtexto" : (file?.name ?? "transcripcion"),
        timestamps,
      );
      if (saved)
        setNotice(`Archivo ${format.toUpperCase()} preparado para guardar.`);
    } catch {
      setError(
        "No pudimos generar el archivo. Intenta de nuevo o descarga en TXT.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="./" aria-label="VoxTexto, inicio">
          <span className="brand-icon">
            <AudioLines size={23} />
          </span>
          VoxTexto<span className="brand-dot">.</span>
        </a>
        <div className="nav-label">TU ESPACIO</div>
        <div className="nav-active">
          <FileText size={18} /> Transcribir <span>01</span>
        </div>
        <button className="new-session" onClick={clear} disabled={busy || capturing}>
          <Plus size={17} /> Nueva transcripción
        </button>
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <span className="privacy-icon">
              <ShieldCheck size={20} />
            </span>
            <strong>Tu voz se queda contigo.</strong>
            <p>
              El audio se procesa en tu equipo. Sin cuentas ni archivos en
              nuestros servidores.
            </p>
            <button onClick={() => setShowHelp(true)}>
              Cómo funciona <ArrowRight size={13} />
            </button>
          </div>
          <span className="version">
            <span /> Escritorio · 0.4.2
          </span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Espacio de trabajo <span>/</span> <strong>Transcripción</strong>
          </div>
          <div className="topbar-actions">
            <button className="icon-button theme-toggle" type="button" data-theme-toggle aria-label="Cambiar modo claro u oscuro" title="Cambiar modo claro u oscuro">
              <Moon className="theme-moon" size={19} />
              <Sun className="theme-sun" size={19} />
            </button>
            {!installation.native && (
              <button
                className="install-button"
                onClick={() => void installation.install()}
                disabled={installation.installed}
                aria-label={
                  installation.installed ? "App instalada" : "Instalar app"
                }
              >
                <Smartphone size={15} />
                {installation.installed ? "Instalada" : "Instalar app"}
              </button>
            )}
            <span className="local-badge">
              <span /> Procesamiento local
            </span>
            <button
              className="icon-button help-button"
              onClick={() => setShowHelp(true)}
              aria-label="Ayuda y privacidad"
            >
              <CircleHelp size={19} />
            </button>
          </div>
        </header>
        <main>
          <div className="intro">
            <div>
              <span className="eyebrow">MENOS TRANSCRIBIR. MÁS CREAR.</span>
              <h1>
                Dale espacio a tus palabras<span>.</span>
              </h1>
              <p>
                Del audio al texto, sin complicaciones. Escucha, corrige y
                llévalo contigo.
              </p>
            </div>
            <div className="intro-mark" aria-hidden="true">
              <AudioLines />
            </div>
          </div>
          <div className="steps" aria-label="Pasos de transcripción">
            {[
              "Selecciona tu audio",
              "Transcribe y revisa",
              "Descarga tu texto",
            ].map((step, index) => (
              <div
                key={step}
                className={
                  (index === 0 && !hasText) || (index === 1 && hasText)
                    ? "step active"
                    : "step"
                }
              >
                <span>
                  {index === 0 && hasText ? (
                    <Check size={13} />
                  ) : (
                    `0${index + 1}`
                  )}
                </span>
                {step}
                {index < 2 && <div className="step-line" />}
              </div>
            ))}
          </div>
          {error && (
            <div className="alert error" role="alert">
              <CircleHelp size={18} />
              <span>{error}</span>
              <button
                className="icon-button"
                onClick={() => setError("")}
                aria-label="Cerrar error"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {window.voxDesktop?.platform === "win32" && <Recorder
            disabled={busy || exporting}
            beforeStart={() => {
              if (!canReplace()) return false;
              player.current?.pause();
              setPlaying(false);
              return true;
            }}
            onActive={setCapturing}
            onError={setError}
            onComplete={(audio, seconds, reason) => {
              void selectFile(audio, seconds);
              if (reason) setNotice(reason);
            }}
          />}
          {recorded && file && !capturing && <div className="recording-review"><span>Tu grabación está lista. Escúchala antes de transcribir y guarda el audio si quieres conservarlo.</span><button className="record-secondary" disabled={busy || exporting} onClick={() => {
            void file.arrayBuffer().then(bytes => window.voxDesktop!.saveFile(file.name,new Uint8Array(bytes))).then(saved => { if(saved) setNotice("Grabación guardada en tu equipo."); }).catch(() => setError("No pudimos guardar la grabación. Inténtalo de nuevo."));
          }}>Guardar audio</button></div>}
          <div className="workspace" inert={capturing}>
            <section
              className="audio-panel panel"
              aria-labelledby="audio-title"
            >
              <div className="panel-heading">
                <h2 id="audio-title">
                  <span className="section-index">01</span> Tu audio
                </h2>
                <Headphones size={18} />
              </div>
              <input
                ref={input}
                id="audio-input"
                type="file"
                className="visually-hidden"
                accept="audio/*,.mp3,.wav,.m4a,.ogg,.opus,.flac,.aac,.webm"
                disabled={busy}
                onChange={(event) => {
                  void selectFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              {!file ? (
                <div
                  className={`dropzone ${dragging ? "dragging" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!busy) setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    void selectFile(event.dataTransfer.files[0]);
                  }}
                >
                  <div className="upload-art" aria-hidden="true">
                    <div className="upload-paper">
                      <AudioLines size={26} />
                    </div>
                    <span>
                      <Plus size={12} />
                    </span>
                  </div>
                  <strong>
                    Una idea. Un audio.
                    <br />
                    Un buen comienzo.
                  </strong>
                  <p>
                    Arrastra tu archivo aquí o<br />
                    selecciónalo desde tu equipo.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => input.current?.click()}
                    disabled={busy}
                  >
                    <Upload size={16} />
                    {phase === "reading"
                      ? "Leyendo audio…"
                      : "Seleccionar audio"}
                  </button>
                  <span className="file-formats">MP3, WAV, M4A y más</span>
                </div>
              ) : (
                <div className="selected-audio">
                  <div className="file-symbol">
                    <FileAudio size={28} />
                  </div>
                  <strong title={file.name}>{file.name}</strong>
                  <span>
                    {formatTime(duration)} <span className="middot">·</span>{" "}
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <div className="selected-ready">
                    <CheckCheck size={15} /> Listo para transcribir
                  </div>
                  <button
                    className="text-button"
                    onClick={() => input.current?.click()}
                    disabled={busy}
                  >
                    Cambiar audio
                  </button>
                  <button className="remove-audio" onClick={clear} disabled={busy}>
                    <Trash2 size={14} aria-hidden="true" /> Eliminar audio
                  </button>
                </div>
              )}
              <div className="file-limits">
                <span>Hasta 60 minutos</span>
                <span>Máximo 100 MB</span>
              </div>
              <div className="audio-options">
                <label id="language-label" htmlFor="language">Idioma del audio</label>
                <LanguageSelect value={language} onChange={setLanguage} disabled={busy} />
                {(language === "spanish-latam" || language === "spanish") && (
                  <div className="language-hint">
                    <p>
                      Latinoamérica y España usan el mismo reconocimiento de
                      español.
                    </p>
                    <p>
                      La selección regional ajusta la revisión ortográfica; no
                      convierte tus expresiones.
                    </p>
                  </div>
                )}
                {phase === "done" && hasText && !isDemo && (
                  <p className="language-hint">
                    Cambiar este menú se aplicará a la próxima transcripción.
                  </p>
                )}
                <button
                  className="settings-toggle"
                  aria-expanded={showSettings}
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <SlidersHorizontal size={14} /> Opciones de procesamiento{" "}
                  <ChevronDown size={14} />
                </button>
                {showSettings && (
                  <div className="engine-settings">
                    <label htmlFor="engine">Motor local</label>
                    <select
                      id="engine"
                      value={engine}
                      onChange={(e) => setEngine(e.target.value as Engine)}
                      disabled={busy}
                    >
                      <option value="auto">
                        Automático · GPU si está disponible
                      </option>
                      <option value="wasm">CPU · mayor compatibilidad</option>
                    </select>
                    <p>
                      La velocidad depende de tu equipo. Los audios largos
                      pueden usar bastante memoria.
                    </p>
                  </div>
                )}
                {busy && (
                  <div className="job-status" role="status">
                    <div>
                      <LoaderCircle size={14} className="spin" />
                      <span>{message || "Leyendo el audio…"}</span>
                    </div>
                    {phase === "transcribing" && (
                      <>
                        <progress
                          max={100}
                          value={progress}
                          aria-label="Progreso de transcripción"
                        />
                        <small>
                          {Math.floor(progress)} % del audio procesado
                        </small>
                      </>
                    )}
                    {phase === "loading" && (
                      <small>
                        La primera descarga puede tardar varios minutos.
                      </small>
                    )}
                  </div>
                )}
                <button
                  className={`button transcribe ${busy ? "cancel-button" : "primary"}`}
                  disabled={!busy && !file}
                  onClick={busy ? stop : () => void transcribe()}
                >
                  {busy ? (
                    <>
                      <X size={16} /> Cancelar proceso
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      {hasText && !isDemo
                        ? "Volver a transcribir"
                        : "Transcribir audio"}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                <p className="model-note">
                  <LockKeyhole size={12} /> Sin subir tu audio. El modelo se
                  descarga la primera vez.
                </p>
              </div>
            </section>
            <section
              className="transcript-panel panel"
              aria-labelledby="transcript-title"
            >
              <div className="panel-heading">
                <h2 id="transcript-title">
                  <span className="section-index">02</span> Tus palabras
                </h2>
                <div className="editor-actions">
                  {hasText && (
                    <span className="editable-badge">
                      {isDemo ? "Ejemplo" : "Editable"}
                    </span>
                  )}
                  <button
                    className="icon-button"
                    onClick={() => void copy()}
                    disabled={!hasText || busy}
                    aria-label="Copiar transcripción"
                  >
                    <Copy size={17} />
                  </button>
                </div>
              </div>
              {phase === "done" || hasText || audioUrl ? (
                <>
                  <div className="editor-toolbar">
                    <span>
                      {isDemo
                        ? "Texto de demostración"
                        : fileStem(file?.name ?? "Transcripción")}
                    </span>
                    <span>{wordCount(segments)} palabras</span>
                  </div>
                  {audioUrl && (
                    <div className="player">
                      <audio
                        ref={player}
                        src={audioUrl}
                        preload="metadata"
                        onTimeUpdate={(e) =>
                          setCurrentTime(e.currentTarget.currentTime)
                        }
                        onPlay={() => setPlaying(true)}
                        onPause={() => setPlaying(false)}
                        onEnded={() => setPlaying(false)}
                      />
                      <button
                        className="play-button"
                        onClick={() => void togglePlay()}
                        aria-label={
                          playing ? "Pausar audio" : "Reproducir audio"
                        }
                      >
                        {playing ? <Pause size={15} /> : <Play size={15} />}
                      </button>
                      <span>{formatTime(currentTime)}</span>
                      <input
                        type="range"
                        min={0}
                        max={duration}
                        step={0.1}
                        value={currentTime}
                        onChange={(e) => seek(Number(e.target.value))}
                        aria-label="Posición del audio"
                      />
                      <span>{formatTime(duration)}</span>
                      <button
                        className="rate-button"
                        onClick={() => {
                          const next =
                            rate === 2
                              ? 0.75
                              : rate === 0.75
                                ? 1
                                : rate === 1
                                  ? 1.25
                                  : rate === 1.25
                                    ? 1.5
                                    : 2;
                          setRate(next);
                          if (player.current)
                            player.current.playbackRate = next;
                        }}
                        aria-label={`Velocidad de reproducción: ${rate}`}
                      >
                        {rate}×
                      </button>
                    </div>
                  )}
                  <div className="segments">
                    {usedLanguage && !isDemo && (
                      <div className="recognized-language" role="status">
                        <strong>
                          Idioma usado: {displayLanguage(usedLanguage.language)}
                        </strong>
                        <span>
                          {usedLanguage.automatic
                            ? "Detectado a partir del audio"
                            : "Seleccionado manualmente"}
                        </span>
                        {usedLanguage.uncertain && (
                          <p>
                            La detección no fue concluyente.
                            <br />
                            Comprueba el idioma y selecciona uno manualmente si
                            hace falta.
                          </p>
                        )}
                      </div>
                    )}
                    {segments.length ? (
                      segments.map((segment) => (
                        <div
                          className={`segment ${audioUrl && currentTime >= segment.start && currentTime < (segment.end ?? duration) ? "current-segment" : ""}`}
                          key={segment.id}
                        >
                          <button
                            className="timestamp"
                            disabled={!audioUrl}
                            onClick={() => seek(segment.start)}
                            aria-label={`Escuchar desde ${formatTime(segment.start)}`}
                          >
                            {formatTime(segment.start)}
                          </button>
                          <SegmentEditor
                            label={`Texto desde ${formatTime(segment.start)}`}
                            text={segment.text}
                            onChange={(text) => editSegment(segment.id, text)}
                            disabled={busy}
                            locale={
                              usedLanguage?.language === "spanish-latam"
                                ? "es-419"
                                : usedLanguage?.language === "spanish"
                                  ? "es-ES"
                                  : usedLanguage?.language.match(
                                      /^[a-z]{2,3}$/,
                                    )?.[0]
                            }
                          />
                        </div>
                      ))
                    ) : (
                      <div className="no-speech">
                        <Headphones size={24} />
                        <p>{phase === "done" ? "No se detectó voz en este audio." : "Tu audio está listo para revisar."}</p>
                        <span>{phase === "done" ? "Prueba seleccionando el idioma manualmente." : busy ? "Estamos preparando tu transcripción." : "Escúchalo, elige el idioma y pulsa Transcribir audio."}</span>
                      </div>
                    )}
                  </div>
                  <div className="session-note">
                    <span className="session-dot" />
                    {dirty
                      ? "Cambios en esta sesión. Descarga para conservarlos."
                      : "Puedes editar el texto directamente."}
                    {engineLabel && !isDemo && (
                      <span className="engine-label">{engineLabel}</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="empty-editor">
                  <div className="empty-illustration" aria-hidden="true">
                    <div className="ghost-lines">
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className="quote-mark">“</span>
                  </div>
                  <h3>Aquí empieza tu próximo texto.</h3>
                  <p>
                    {busy
                      ? "Tu equipo está preparando la transcripción."
                      : "Tus ideas ya tienen voz. Vamos a darles palabras."}
                  </p>
                  {!busy && (
                    <button className="demo-button" onClick={loadDemo}>
                      Explorar con un ejemplo <ArrowRight size={14} />
                    </button>
                  )}
                  {busy && <LoaderCircle className="spin" size={23} />}
                </div>
              )}
              <div className="export-bar">
                <div className="export-label">
                  <ArrowDownToLine size={17} />
                  <span>Llévalo contigo</span>
                </div>
                <div className="export-controls">
                  <label className="timestamp-check">
                    <input
                      type="checkbox"
                      checked={timestamps}
                      onChange={(e) => setTimestamps(e.target.checked)}
                    />{" "}
                    Marcas de tiempo
                  </label>
                  <select
                    aria-label="Formato de descarga"
                    value={format}
                    onChange={(e) => setFormat(e.target.value as ExportFormat)}
                    disabled={exporting}
                  >
                    <option value="txt">TXT</option>
                    <option value="docx">Word (.docx)</option>
                    <option value="pdf">PDF</option>
                  </select>
                  <button
                    className="button export-button"
                    onClick={() => void download()}
                    disabled={!hasText || busy || exporting}
                  >
                    {exporting ? (
                      <LoaderCircle className="spin" size={15} />
                    ) : (
                      <ArrowDownToLine size={15} />
                    )}{" "}
                    Descargar
                  </button>
                </div>
              </div>
            </section>
          </div>
          <div className="bottom-notes">
            <span>
              <ShieldCheck size={15} /> Privado desde el primer segundo
            </span>
            <span>
              <Monitor size={15} /> En tu navegador, celular y escritorio
            </span>
            <span>
              <FileText size={15} /> Tus palabras, a tu manera
            </span>
          </div>
          <footer>
            {import.meta.env.BASE_URL === "/app/" && (
              <nav className="public-links" aria-label="Información pública">
                <a href="/">Sitio web</a>
                <a href="/como-funciona/">Guía</a>
                <a href="/privacidad/">Privacidad</a>
              </nav>
            )}
            <span>
              VoxTexto <span className="footer-divider">/</span> De tu voz a lo
              que sigue.
            </span>
            <button onClick={() => setShowHelp(true)}>
              Privacidad y créditos <ArrowRight size={12} />
            </button>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
          <button
            className="icon-button"
            onClick={() => setNotice("")}
            aria-label="Cerrar aviso"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <dialog
        ref={help}
        className="help-dialog"
        onCancel={() => setShowHelp(false)}
        onClick={(e) => {
          if (e.target === help.current) setShowHelp(false);
        }}
      >
        <div className="dialog-heading">
          <span className="brand-icon">
            <AudioLines size={23} />
          </span>
          <h2>Tu audio, bajo tu control.</h2>
          <button
            className="icon-button"
            onClick={() => setShowHelp(false)}
            aria-label="Cerrar ayuda"
          >
            <X size={20} />
          </button>
        </div>
        <Information />
        <button
          className="button primary dialog-close"
          onClick={() => setShowHelp(false)}
        >
          Entendido <Check size={16} />
        </button>
      </dialog>
      <InstallHelp
        open={installation.showInstall}
        onClose={() => installation.setShowInstall(false)}
      />
    </div>
  );
}
