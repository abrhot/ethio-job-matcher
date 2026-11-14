import { logInfo } from "../log";
import { assertSafeCv } from "./cv-guard";
import { extractProfileFromText, type ExtractedProfile } from "./extract";

export async function extractTextFromCv(filename: string, bytes: Uint8Array): Promise<string> {
  assertSafeCv(filename, bytes);
  const lower = filename.toLowerCase();
  if (lower.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return result.value.trim();
  }
  if (lower.endsWith(".pdf")) {
    const { extractText } = await import("unpdf");
    const extracted = await extractText(bytes, { mergePages: true });
    return (Array.isArray(extracted.text) ? extracted.text.join("\n") : extracted.text).trim();
  }
  return new TextDecoder().decode(bytes).trim();
}

export async function profileFromCv(
  filename: string,
  bytes: Uint8Array,
): Promise<{ text: string; profile: ExtractedProfile; filename: string }> {
  const safeName = assertSafeCv(filename, bytes);
  logInfo("cv", "accepted upload", { bytes: bytes.byteLength });
  const text = await extractTextFromCv(safeName, bytes);
  if (text.length < 20) {
    throw new Error(
      "Could not read enough text from that file. Upload a PDF or DOCX with selectable text.",
    );
  }
  return { text: text.slice(0, 12_000), profile: extractProfileFromText(text), filename: safeName };
}
