import { downloadBlob } from "./download";

// export ผัง SVG เป็น PNG ฝั่ง browser โดยไม่พึ่ง lib
// SVG ที่ถูกวาดเป็นรูป (<img>/canvas) มองไม่เห็น CSS ของหน้า และโหลดไฟล์ภายนอกไม่ได้ จึงต้อง:
//   1. คัดลอกค่าสี/ฟอนต์ที่คำนวณแล้วลงบนแต่ละ element (CSS variable, light-dark(), class ใช้ไม่ได้ในรูป)
//   2. ฝังฟอนต์เป็น data URI ไม่งั้นตัวไทยในผังจะตกไปใช้ฟอนต์ระบบ

const STYLE_PROPS = [
  "fill",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "stroke-opacity",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
] as const;

/** ใส่ style ที่คำนวณแล้วจาก element ต้นฉบับลง clone ทีละคู่ (โครงเหมือนกันทุกประการ) */
function inlineStyles(source: Element, target: Element) {
  const cs = getComputedStyle(source);
  const decl = STYLE_PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(";");
  target.setAttribute("style", decl);
  for (let i = 0; i < source.children.length; i++) inlineStyles(source.children[i], target.children[i]);
}

/** แปลงไฟล์ฟอนต์ที่หน้าเว็บใช้อยู่ (next/font โฮสต์ไว้เอง) เป็น @font-face แบบฝัง เฉพาะตระกูลและน้ำหนักที่ผังใช้ */
async function embeddedFontFaces(families: Set<string>, weights: Set<string>) {
  // url ใน @font-face เป็น relative กับไฟล์ CSS (เช่น ../media/x.woff2) ไม่ใช่กับหน้าเว็บ จึงเก็บ href ของ sheet ไว้ resolve
  const rules: { rule: CSSFontFaceRule; base: string }[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let list: CSSRuleList;
    try {
      list = sheet.cssRules;
    } catch {
      continue; // stylesheet ต่าง origin อ่านไม่ได้ ซึ่งไม่ใช่ฟอนต์ของเราอยู่แล้ว
    }
    for (const r of Array.from(list)) {
      if (!(r instanceof CSSFontFaceRule)) continue;
      const family = r.style.getPropertyValue("font-family").replace(/["']/g, "").trim();
      const weight = r.style.getPropertyValue("font-weight") || "400";
      // เอาเฉพาะ subset ไทยกับละตินพื้นฐาน (ผังใช้แค่นี้) ไฟล์ฟอนต์ยิ่งน้อย ยิ่งโหลดในรูปเสร็จเร็ว
      const range = r.style.getPropertyValue("unicode-range");
      const needed = !range || /U\+0E|U\+0+-0*FF\b/i.test(range);
      if (families.has(family) && weights.has(weight) && needed) rules.push({ rule: r, base: sheet.href ?? location.href });
    }
  }

  const css = await Promise.all(
    rules.map(async ({ rule: r, base }) => {
      const src = r.style.getPropertyValue("src");
      const url = src.match(/url\(["']?([^"')]+)["']?\)/)?.[1];
      if (!url) return "";
      const res = await fetch(new URL(url, base));
      if (!res.ok) throw new Error("โหลดฟอนต์สำหรับรูปไม่สำเร็จ");
      const blob = await res.blob();
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const range = r.style.getPropertyValue("unicode-range");
      return `@font-face{font-family:"${r.style.getPropertyValue("font-family").replace(/["']/g, "")}";` +
        `font-weight:${r.style.getPropertyValue("font-weight") || 400};font-style:normal;` +
        (range ? `unicode-range:${range};` : "") +
        `src:url(${data}) format("woff2");}`;
    }),
  );
  return css.join("");
}

function familiesOf(fontFamily: string) {
  return fontFamily.split(",").map((f) => f.replace(/["']/g, "").trim()).filter(Boolean);
}

export async function exportChartPng(
  svg: SVGSVGElement,
  opts: { filename: string; title: string; subtitle: string },
) {
  const root = document.documentElement;
  const prevTheme = root.getAttribute("data-theme");
  const prevDim = svg.getAttribute("data-dim");

  // ไฟล์ที่ส่งอาจารย์ใช้ธีมสว่างเสมอ (พิมพ์/ดูบนจอไหนก็อ่านได้) และไม่เอาไฮไลต์ที่ค้างอยู่
  // สลับแล้วอ่านค่าแบบ synchronous แล้วคืนทันที เบราว์เซอร์ไม่ทันวาดจอ จึงไม่เห็นกะพริบ
  root.setAttribute("data-theme", "light");
  svg.removeAttribute("data-dim");
  const clone = svg.cloneNode(true) as SVGSVGElement;
  let background: string, ink: string, inkSoft: string, headingFont: string, bodyFont: string;
  const families = new Set<string>();
  try {
    inlineStyles(svg, clone);
    const rootStyle = getComputedStyle(root);
    background = getComputedStyle(document.body).backgroundColor || "#fff";
    ink = rootStyle.getPropertyValue("--ink").trim() || "#000";
    inkSoft = rootStyle.getPropertyValue("--ink-soft").trim() || "#666";
    headingFont = getComputedStyle(document.querySelector("h1") ?? document.body).fontFamily;
    bodyFont = getComputedStyle(document.body).fontFamily;
    familiesOf(getComputedStyle(svg).fontFamily).forEach((f) => families.add(f));
  } finally {
    if (prevTheme) root.setAttribute("data-theme", prevTheme);
    else root.removeAttribute("data-theme");
    if (prevDim !== null) svg.setAttribute("data-dim", prevDim);
  }

  clone.removeAttribute("data-dim");
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const width = Number(svg.getAttribute("width"));
  const height = Number(svg.getAttribute("height"));

  const fontCss = await embeddedFontFaces(families, new Set(["400", "600"]));
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = fontCss;
  clone.insertBefore(style, clone.firstChild);

  const svgUrl = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const img = new Image();
    img.src = svgUrl;
    await img.decode();
    // ฟอนต์ที่ฝังใน SVG โหลดต่อหลัง decode แบบ async ระหว่างนั้นข้อความที่ใช้ฟอนต์นั้นจะถูกซ่อน (font block period)
    // ถ้าวาดทันทีบรรทัดไทย/ป้ายสถานะจะหายจากรูป จึงรอให้รูปวาดใหม่หลังฟอนต์พร้อมก่อน
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, 500));

    const pad = 32;
    const header = 84;
    const scale = 2; // ความละเอียด 2 เท่า ซูมดูบนจอ retina/พิมพ์แล้วไม่แตก
    const canvas = document.createElement("canvas");
    canvas.width = (width + pad * 2) * scale;
    canvas.height = (height + header + pad) * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("เบราว์เซอร์นี้สร้างรูปไม่ได้");
    ctx.scale(scale, scale);

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width + pad * 2, height + header + pad);
    // หัวกระดาษใช้ฟอนต์ที่หน้าเว็บโหลดไว้แล้ว (canvas ใช้ฟอนต์ของ document ได้ตรงๆ)
    ctx.fillStyle = ink;
    ctx.font = `600 24px ${headingFont}`;
    ctx.fillText(opts.title, pad, pad + 22);
    ctx.fillStyle = inkSoft;
    ctx.font = `400 15px ${bodyFont}`;
    ctx.fillText(opts.subtitle, pad, pad + 48);

    ctx.drawImage(img, pad, header, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("สร้างไฟล์ PNG ไม่สำเร็จ");
    downloadBlob(blob, opts.filename);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
