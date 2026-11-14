export class CvRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CvRejectedError";
  }
}

const MAX_BYTES = 4 * 1024 * 1024;

export function assertSafeCv(filename: string, bytes: Uint8Array): string {
  if (bytes.byteLength === 0) throw new CvRejectedError("The file is empty.");
  if (bytes.byteLength > MAX_BYTES) throw new CvRejectedError("CV files must be 4 MB or smaller.");
  if (/[/\\]|\.\./.test(filename)) {
    throw new CvRejectedError("Upload a PDF or DOCX. Avoid unusual characters in the file name.");
  }
  const base = filename.trim();
  if (!/^[A-Za-z0-9._ ()-]{1,120}\.(pdf|docx)$/i.test(base)) {
    throw new CvRejectedError("Upload a PDF or DOCX. Avoid unusual characters in the file name.");
  }
  const pdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  const docx =
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07) &&
    (bytes[3] === 0x04 || bytes[3] === 0x06 || bytes[3] === 0x08);
  const isPdf = base.toLowerCase().endsWith(".pdf");
  if (isPdf && !pdf) throw new CvRejectedError("That file does not look like a PDF.");
  if (!isPdf && !docx) throw new CvRejectedError("That file does not look like a DOCX document.");
  return base;
}
