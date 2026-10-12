import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import mammoth from "mammoth/mammoth.browser";
import { createWorker } from "tesseract.js";

export const SUPPORTED_EXTENSIONS = ["pdf", "docx", "jpg", "jpeg", "png"];

function extensionOf(file) {
  return (file.name.split(".").pop() || "").toLowerCase();
}

function readableError(error) {
  const message = String(error?.message || error || "");
  if (/password|encrypted/i.test(message)) return "This file is password-protected. Remove the password and try again.";
  if (/Invalid|PDF|corrupt|parse/i.test(message)) return "The file is corrupted or could not be read.";
  return "The file could not be read. Try exporting it again as a PDF, DOCX, JPG, or PNG.";
}

async function ocrImage(source, onProgress) {
  const worker = await createWorker("eng", 1, { logger: data => onProgress?.(Math.round((data.progress || 0) * 100)) });
  try {
    const result = await worker.recognize(source);
    return { text: result.data.text || "", confidence: Math.round(result.data.confidence || 0) };
  } finally {
    await worker.terminate();
  }
}

async function extractPdf(file, onProgress) {
  const bytes = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  let text = "";
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(" ").trim();
    text += `${pageText}\n`;
    onProgress?.(Math.round((pageNumber / pdf.numPages) * 50));
  }
  if (text.replace(/\s/g, "").length >= 80) return { text: text.trim(), confidence: 95, method: "text" };

  let ocrText = "";
  let ocrConfidence = 0;
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.8 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    const result = await ocrImage(canvas, value => onProgress?.(50 + Math.round(((pageNumber - 1) + value / 100) / pdf.numPages * 50)));
    ocrText += `${result.text}\n`;
    ocrConfidence += result.confidence;
  }
  return { text: ocrText.trim(), confidence: pdf.numPages ? Math.round(ocrConfidence / pdf.numPages) : 0, method: "ocr" };
}

export async function extractResumeText(file, onProgress) {
  if (!file) throw new Error("Choose a resume file first.");
  const ext = extensionOf(file);
  if (!SUPPORTED_EXTENSIONS.includes(ext)) throw new Error("Unsupported file type. Use PDF, DOCX, JPG, JPEG, or PNG.");
  try {
    let result;
    if (ext === "pdf") result = await extractPdf(file, onProgress);
    else if (ext === "docx") {
      const data = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      result = { text: data.value.trim(), confidence: 98, method: "text" };
    } else result = { ...(await ocrImage(file, onProgress)), method: "ocr" };
    const text = (result.text || "").replace(new RegExp(String.fromCharCode(0), "g"), "").trim();
    if (!text) throw new Error("No readable text was found. This file may be empty or unreadable.");
    return { text, confidence: Math.max(0, Math.min(100, result.confidence)), method: result.method };
  } catch (error) {
    throw new Error(readableError(error));
  }
}
