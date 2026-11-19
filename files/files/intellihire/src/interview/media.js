export function browserSupport() {
  const supported = typeof window !== "undefined" && Boolean(window.navigator?.mediaDevices?.getUserMedia);
  return { supported, message: supported ? "Camera and microphone APIs are available." : "Use the latest Chrome or Edge over HTTPS or localhost." };
}

export async function listMediaDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return { cameras: [], microphones: [] };
  const devices = await navigator.mediaDevices.enumerateDevices();
  return {
    cameras: devices.filter(device => device.kind === "videoinput"),
    microphones: devices.filter(device => device.kind === "audioinput")
  };
}

export async function requestMedia(cameraId = "", microphoneId = "") {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
  return navigator.mediaDevices.getUserMedia({
    video: cameraId ? { deviceId: { exact: cameraId } } : true,
    audio: microphoneId ? { deviceId: { exact: microphoneId } } : true
  });
}

export function stopMedia(stream) {
  stream?.getTracks().forEach(track => track.stop());
}

export function startAudioMeter(stream, onLevel) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass || !stream?.getAudioTracks().length) return () => {};
  const context = new AudioContextClass();
  const analyser = context.createAnalyser();
  const source = context.createMediaStreamSource(stream);
  const data = new Uint8Array(analyser.fftSize);
  source.connect(analyser);
  let frame;
  const update = () => {
    analyser.getByteTimeDomainData(data);
    const level = Math.min(100, Math.round(data.reduce((sum, value) => sum + Math.abs(value - 128), 0) / data.length * 3));
    onLevel(level);
    frame = requestAnimationFrame(update);
  };
  update();
  return () => { cancelAnimationFrame(frame); source.disconnect(); analyser.disconnect(); context.close(); };
}