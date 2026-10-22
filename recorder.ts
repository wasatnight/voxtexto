export type RecordingState = "starting" | "recording" | "paused" | "stopping" | "idle";
export const RECORDING_LIMIT_SECONDS = 3600;
export const RECORDING_LIMIT_BYTES = 90 * 1024 * 1024;
export function recordingSeconds(accumulated: number, started: number | null, now: number) {
  return (accumulated + (started === null ? 0 : Math.max(0, now - started))) / 1000;
}

export class LocalRecorder {
  private streams: MediaStream[] = [];
  private context?: AudioContext;
  private recorder?: MediaRecorder;
  private chunks: Blob[] = [];
  private bytes = 0;
  private elapsed = 0;
  private started: number | null = null;
  private timer?: ReturnType<typeof setInterval>;
  private cancelled = false;
  private failed = false;
  private ending = false;
  private level = 0;
  private analyser?: AnalyserNode;
  state: RecordingState = "starting";
  constructor(private callbacks: {
    update(state: RecordingState, seconds: number, level: number): void;
    complete(file: File, seconds: number, reason: string): void;
    error(message: string): void;
  }) {}
  seconds() { return recordingSeconds(this.elapsed, this.started, performance.now()); }
  async start(microphone: boolean) {
    try {
      if (!window.voxDesktop || window.voxDesktop.platform !== "win32") throw new Error("Abre la app de Windows para grabar el audio del sistema.");
      const mime = ["audio/webm;codecs=opus", "audio/webm"].find(type => MediaRecorder.isTypeSupported(type));
      if (!mime) throw new Error("Este equipo no dispone del codificador de audio necesario.");
      await window.voxDesktop.prepareCapture();
      if (this.cancelled) { await this.cleanup(); return; }
      const system = await navigator.mediaDevices.getDisplayMedia({video:{frameRate:1,width:320,height:180},audio:true});
      this.streams.push(system);
      if (this.cancelled) { await this.cleanup(); return; }
      if (!system.getAudioTracks().length) throw new Error("Windows no entregó audio del sistema. Comprueba el dispositivo de salida e inténtalo de nuevo.");
      // Video is required to obtain the loopback stream, but is never recorded.
      system.getVideoTracks().forEach(track => track.stop());
      if (microphone) {
        const mic = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
        this.streams.push(mic);
      }
      if (this.cancelled) { await this.cleanup(); return; }
      this.context = new AudioContext();
      await this.context.resume();
      const output = this.context.createMediaStreamDestination();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 512;
      const limiter = this.context.createDynamicsCompressor();
      limiter.connect(this.analyser);
      this.analyser.connect(output);
      this.streams.forEach(stream => {
        const source = this.context!.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));
        const gain = this.context!.createGain();
        gain.gain.value = microphone ? .7 : 1;
        source.connect(gain).connect(limiter);
        stream.getAudioTracks().forEach(track => track.addEventListener("ended", () => this.stop("Se desconectó un dispositivo de audio."), {once:true}));
      });
      this.streams.push(output.stream);
      this.recorder = new MediaRecorder(output.stream, {mimeType:mime,audioBitsPerSecond:64_000});
      this.recorder.ondataavailable = event => {
        if (event.data.size) { this.chunks.push(event.data); this.bytes += event.data.size; }
        if (this.bytes >= RECORDING_LIMIT_BYTES) this.stop("Se alcanzó el límite de tamaño de la grabación.");
      };
      this.recorder.onerror = () => { this.failed = true; this.stop(); this.callbacks.error("No pudimos continuar grabando. Vuelve a intentarlo."); };
      this.recorder.onstop = () => { void this.finish(mime); };
      this.recorder.start(1000);
      this.started = performance.now();
      this.state = "recording";
      this.callbacks.update(this.state, 0, 0);
      this.timer = setInterval(() => {
        const samples = new Float32Array(this.analyser!.fftSize);
        this.analyser!.getFloatTimeDomainData(samples);
        this.level = this.state === "paused" ? 0 : Math.min(1, Math.sqrt(samples.reduce((sum,n) => sum+n*n,0)/samples.length)*4);
        this.callbacks.update(this.state, this.seconds(), this.level);
        if (this.seconds() >= RECORDING_LIMIT_SECONDS - .5) this.stop("Se alcanzó el máximo de 60 minutos.");
      }, 150);
    } catch (error) {
      await this.cleanup();
      this.state = "idle";
      this.callbacks.update(this.state, 0, 0);
      if (!this.cancelled) this.callbacks.error(error instanceof DOMException ? "No se pudo acceder al audio. Revisa los permisos de Windows; si el micrófono no está disponible, desactívalo e intenta de nuevo." : (error as Error).message);
    }
  }
  pause() {
    if (this.state !== "recording") return;
    this.recorder!.pause();
    this.elapsed = this.seconds()*1000;
    this.started = null;
    this.state = "paused";
    this.callbacks.update(this.state, this.seconds(), 0);
  }
  resume() {
    if (this.state !== "paused") return;
    this.recorder!.resume();
    this.started = performance.now();
    this.state = "recording";
    this.callbacks.update(this.state, this.seconds(), 0);
  }
  private reason = "";
  stop(reason = "") {
    if (this.ending || !this.recorder || this.recorder.state === "inactive") return;
    this.ending = true;
    this.reason = reason;
    this.elapsed = this.seconds()*1000;
    this.started = null;
    clearInterval(this.timer);
    this.state = "stopping";
    this.callbacks.update(this.state, this.seconds(), 0);
    this.recorder.stop();
  }
  cancel() { this.cancelled = true; if (this.recorder && this.recorder.state !== "inactive") this.stop(); else void this.cleanup(); }
  private async finish(mime: string) {
    const duration = Math.min(RECORDING_LIMIT_SECONDS, this.seconds());
    const blob = new Blob(this.chunks, {type:mime});
    this.chunks = [];
    await this.cleanup();
    this.state = "idle";
    this.callbacks.update(this.state, duration, 0);
    if (this.cancelled || this.failed) return;
    if (duration < 1 || blob.size === 0) return this.callbacks.error("Graba al menos un segundo antes de detener.");
    const name = `grabacion-${new Date().toISOString().replace(/[:.]/g,"-")}.webm`;
    this.callbacks.complete(new File([blob],name,{type:"audio/webm"}),duration,this.reason);
  }
  private async cleanup() {
    clearInterval(this.timer);
    this.streams.forEach(stream => stream.getTracks().forEach(track => track.stop()));
    this.streams = [];
    if (this.context && this.context.state !== "closed") await this.context.close().catch(() => {});
    await window.voxDesktop?.releaseCapture().catch(() => {});
  }
}
