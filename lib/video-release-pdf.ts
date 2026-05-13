import { PDFDocument, StandardFonts, type PDFFont, type PDFPage, rgb } from "pdf-lib";

/** Same substance as the public form (keep in sync when legal copy changes). */
const CLAUSE_BLOCKS: string[] = [
  "1. Authority — I confirm I have authority to grant this release on behalf of myself and, where applicable, other residents or owners of the premises.",
  "2. Recording — I authorize Clean to the Macks and its personnel to record still images and video before, during, and after scheduled services at the address below, without additional compensation for such use as described in this release.",
  "3. License — I grant Clean to the Macks a non-exclusive, royalty-free license to use, reproduce, edit, distribute, and publicly display those recordings in connection with its business, including online and print marketing.",
  "4. Revocation — I understand I may request in writing that the Company cease using identifiable recordings going forward; the Company will use reasonable efforts to comply where practicable and will not be required to recall materials already distributed.",
  "5. Release — I release the Company from claims arising from authorized use consistent with this document, except for gross negligence or willful misconduct to the extent permitted by law.",
];

export type VideoReleasePdfRecord = {
  clientName: string;
  clientEmail: string;
  propertyAddress: string | null;
  signedAt: Date;
  signerName: string | null;
  signatureImageDataUrl: string | null;
  signatureText: string | null;
  signerIp: string | null;
  signerUserAgent: string | null;
};

export function safeVideoReleaseFilename(signerOrClient: string): string {
  const t = signerOrClient.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_").trim();
  return (t.slice(0, 72) || "signed-release") + ".pdf";
}

function wrapToLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) {
      lines.push(line);
      line = "";
    }
    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      line = word;
      continue;
    }
    let chunk = "";
    for (const ch of word) {
      const next = chunk + ch;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) chunk = next;
      else {
        if (chunk) lines.push(chunk);
        chunk = ch;
      }
    }
    line = chunk;
  }
  if (line) lines.push(line);
  return lines;
}

function drawLines(
  page: PDFPage,
  lines: string[],
  x: number,
  yTop: number,
  font: PDFFont,
  size: number,
  leading: number,
  color = rgb(0.12, 0.14, 0.18),
): number {
  let y = yTop;
  for (const ln of lines) {
    page.drawText(ln, { x, y, size, font, color });
    y -= leading;
  }
  return y;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

export async function buildVideoReleasePdfBytes(data: VideoReleasePdfRecord): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const pageW = 612;
  const pageH = 792;
  const contentW = pageW - margin * 2;
  const bottom = margin + 24;
  const lineBody = 11;
  const leadBody = 13;
  const lineTitle = 13;
  const leadTitle = 16;

  let page = pdf.addPage([pageW, pageH]);
  let y = pageH - margin;

  const newPage = () => {
    page = pdf.addPage([pageW, pageH]);
    y = pageH - margin;
  };

  const need = (h: number) => {
    if (y - h < bottom) newPage();
  };

  need(lineTitle + 8);
  page.drawText("VIDEO / MEDIA RELEASE AUTHORIZATION", {
    x: margin,
    y,
    size: lineTitle,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.22),
  });
  y -= leadTitle + 6;

  const intro =
    "This document records your authorization for Clean to the Macks to capture and use photographic and video recordings of services performed at the property identified below, for business purposes including marketing, portfolio, website, and social media.";
  const introLines = wrapToLines(intro, font, lineBody, contentW);
  need(introLines.length * leadBody + 8);
  y = drawLines(page, introLines, margin, y, font, lineBody, leadBody);
  y -= 10;

  const parties = [
    `Client: ${data.clientName}`,
    `Email: ${data.clientEmail}`,
    ...(data.propertyAddress ? [`Property: ${data.propertyAddress}`] : []),
  ];
  for (const p of parties) {
    need(leadBody);
    y = drawLines(page, wrapToLines(p, font, lineBody, contentW), margin, y, font, lineBody, leadBody);
  }
  y -= 12;

  need(lineTitle);
  page.drawText("Terms", { x: margin, y, size: lineTitle, font: fontBold, color: rgb(0.1, 0.12, 0.2) });
  y -= leadTitle;

  for (const block of CLAUSE_BLOCKS) {
    const ls = wrapToLines(block, font, lineBody, contentW);
    need(ls.length * leadBody + 6);
    y = drawLines(page, ls, margin, y, font, lineBody, leadBody);
    y -= 4;
  }
  y -= 8;

  const notice =
    "Electronic signature: By signing, you agree this electronic record is valid and enforceable to the same extent as a handwritten signature. IP address and browser information may be stored for audit purposes.";
  const noticeLines = wrapToLines(notice, font, 10, contentW);
  need(noticeLines.length * 12 + 8);
  y = drawLines(page, noticeLines, margin, y, font, 10, 12, rgb(0.25, 0.28, 0.32));
  y -= 16;

  need(lineTitle + leadBody * 2);
  page.drawText("Signature", { x: margin, y, size: lineTitle, font: fontBold, color: rgb(0.1, 0.12, 0.2) });
  y -= leadTitle;

  const printed = data.signerName?.trim() || data.clientName;
  need(leadBody * 2);
  y = drawLines(
    page,
    wrapToLines(`Printed name: ${printed}`, font, lineBody, contentW),
    margin,
    y,
    font,
    lineBody,
    leadBody,
  );

  const signedStr = data.signedAt.toLocaleString();
  need(leadBody);
  y = drawLines(page, [`Signed: ${signedStr}`], margin, y, font, lineBody, leadBody);

  const prefix = "data:image/png;base64,";
  if (data.signatureImageDataUrl?.startsWith(prefix)) {
    try {
      const b64 = data.signatureImageDataUrl.slice(prefix.length);
      const pngBytes = Buffer.from(b64, "base64");
      const image = await pdf.embedPng(pngBytes);
      const maxImgW = Math.min(contentW, 420);
      const scale = maxImgW / image.width;
      const imgW = image.width * scale;
      const imgH = image.height * scale;
      need(imgH + 28);
      y -= 8;
      const yImgBottom = y - imgH;
      page.drawImage(image, { x: margin, y: yImgBottom, width: imgW, height: imgH });
      y = yImgBottom - 16;
    } catch {
      need(leadBody * 2);
      y = drawLines(
        page,
        ["[Signature image could not be embedded in this PDF.]"],
        margin,
        y,
        font,
        lineBody,
        leadBody,
        rgb(0.6, 0.2, 0.2),
      );
    }
  } else if (data.signatureText?.trim()) {
    need(leadBody * 2);
    y = drawLines(
      page,
      wrapToLines(`Typed signature (legacy): ${data.signatureText.trim()}`, font, lineBody, contentW),
      margin,
      y,
      font,
      lineBody,
      leadBody,
    );
  }

  y -= 8;
  need(leadBody * 3);
  page.drawText("Audit", { x: margin, y, size: lineTitle, font: fontBold, color: rgb(0.1, 0.12, 0.2) });
  y -= leadTitle;
  if (data.signerIp) {
    y = drawLines(page, wrapToLines(`IP: ${data.signerIp}`, font, 10, contentW), margin, y, font, 10, 12);
  }
  if (data.signerUserAgent) {
    y = drawLines(
      page,
      wrapToLines(`User-Agent: ${truncate(data.signerUserAgent, 220)}`, font, 9, contentW),
      margin,
      y,
      font,
      9,
      11,
    );
  }

  return pdf.save();
}
