import { redact } from "@fineprint/core";

// pulls text out of the file on the device, the original file is never uploaded
export async function readBillText(file: File): Promise<string> {
  if (file.type === "application/pdf") return redact(await pdfText(file));
  if (file.type.startsWith("image/")) return redact(await imageText(file));
  return redact(await file.text()); // .txt support, mostly for tests and demos
}

async function pdfText(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    for (const item of content.items) if ("str" in item) out += item.str + (item.hasEOL ? "\n" : " ");
    out += "\n";
  }
  return out;
}

async function imageText(file: File) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  const { data } = await worker.recognize(file);
  await worker.terminate();
  return data.text;
}