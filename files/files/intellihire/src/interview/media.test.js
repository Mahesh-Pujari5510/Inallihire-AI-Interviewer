import { browserSupport } from "./media";

test("reports browser media support clearly", () => {
  const originalMediaDevices = navigator.mediaDevices;
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: jest.fn() } });
  expect(browserSupport()).toEqual({ supported: true, message: "Camera and microphone APIs are available." });
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: originalMediaDevices });
});