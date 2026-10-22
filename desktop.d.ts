export {};
declare global {
  interface Window {
    voxDesktop?: {
      platform: string;
      prepareCapture(): Promise<void>;
      releaseCapture(): Promise<void>;
      saveFile(name: string, bytes: Uint8Array): Promise<boolean>;
    };
  }
}
