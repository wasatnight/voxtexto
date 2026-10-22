import {useEffect, useRef, useState} from "react";
import {Mic, Pause, Play, Radio, Square} from "lucide-react";
import {LocalRecorder, type RecordingState} from "./lib/recorder";
import {formatTime} from "./lib/transcript";

export default function Recorder({disabled,beforeStart,onActive,onComplete,onError}:{disabled:boolean;beforeStart():boolean;onActive(active:boolean):void;onComplete(file:File,seconds:number,reason:string):void;onError(message:string):void}) {
  const [state,setState] = useState<RecordingState>("idle");
  const [microphone,setMicrophone] = useState(false);
  const [seconds,setSeconds] = useState(0);
  const [level,setLevel] = useState(0);
  const recorder = useRef<LocalRecorder | null>(null);
  const active = state !== "idle";
  useEffect(() => () => recorder.current?.cancel(), []);
  async function start() {
    if (active || disabled || !beforeStart()) return;
    setState("starting");
    setSeconds(0);
    onActive(true);
    const instance = new LocalRecorder({
      update: (next,time,volume) => { setState(next); setSeconds(time); setLevel(volume); onActive(next !== "idle"); },
      complete: onComplete,
      error: onError,
    });
    recorder.current = instance;
    await instance.start(microphone);
  }
  return <section className="recorder panel" aria-labelledby="recording-title">
    <div className="recorder-copy"><span className="recorder-icon"><Radio size={23}/></span><div><h2 id="recording-title">De tu llamada a tus palabras.</h2><p>Graba lo que se escucha en Windows y transcríbelo al terminar.</p></div></div>
    <div className="recording-controls">
      <label className="mic-option"><input type="checkbox" checked={microphone} disabled={active || disabled} onChange={event => setMicrophone(event.target.checked)}/><Mic size={15}/> Incluir mi micrófono</label>
      {active ? <div className="recording-session">
        <span className={`recording-status ${state}`} role="status">{state === "starting" ? "Preparando…" : state === "stopping" ? "Preparando audio…" : state === "paused" ? "En pausa" : "Grabando"}</span>
        <time className="recording-time">{formatTime(seconds)} / 60:00</time>
        <meter min="0" max="1" value={level} aria-label="Nivel del audio"/>
        {state === "recording" || state === "paused" ? <><button className="record-secondary" onClick={() => state === "paused" ? recorder.current?.resume() : recorder.current?.pause()}>{state === "paused" ? <Play size={15}/> : <Pause size={15}/>} {state === "paused" ? "Reanudar" : "Pausar"}</button><button className="record-primary" onClick={() => recorder.current?.stop()}><Square size={14}/> Detener y revisar</button></> : null}
      </div> : <button className="record-primary" disabled={disabled} onClick={() => void start()}><Radio size={16}/> Grabar audio del sistema</button>}
    </div>
    <p className="recording-note">Solo audio, sin video. Captura también otros sonidos del equipo; silencia las notificaciones. Avisa a quienes participen antes de grabar. {active ? "La grabación permanece en memoria: mantén la app abierta." : "Hasta 60 minutos; no se sube a ningún servidor."}</p>
  </section>;
}
