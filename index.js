const dataPath = "https://docs.google.com/spreadsheets/d/1HbszmbhIAaqkzicjBfGcJGbQ3yyVpSnC0Ap9Xev0Rmk/export?format=csv";
let ready = false;
let data;

const DPI = 150;
const pageWidthIn = 11;
const pageHeightIn = 8.5;

// page size in mm for jsPDF
const pageWidthMM = pageWidthIn * 25.4;
const pageHeightMM = pageHeightIn * 25.4;

// canvas pixel size (inches * DPI)
const canvasW = Math.round(pageWidthIn * DPI);
const canvasH = Math.round(pageHeightIn * DPI);

let canvas;
let ctx;

main();

async function main() {
  data = await d3.csv(dataPath);
  // console.log(data);
  ready = true;

  canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  ctx = canvas.getContext("2d");

  const general = d3.select("#general");
  general.style("display", "flex");
}

async function queryData() {
  const input = d3.select("#input").property("value");
  const query = data.filter(d => d.correo == input.toLowerCase());
  if (query.length <= 0) {
    alert("El correo no está registrado entre los participantes confirmados.");
  } else {
    const name = query[0].nombre;
    const titles = query.map(d => `— ${d.tipo} de: "${d.titulo}"`);
    await renderCertificate(name, titles);
    await makePdf();
  }
}

async function renderCertificate(name, titles) {
  const maxTextWidth = canvasW * 0.8;
  const lineHeight = Math.round(canvasH * 0.04);

  const yDiv = 20;
  const yUnit = canvasH / yDiv;
  const base = yUnit * 5;

  ctx.clearRect(0,0,canvasW,canvasH);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0,0,canvasW,canvasH);

  await drawLogo(ctx, "Logo.png", canvasW * 0.5, canvasH * 0.1, canvasW * 0.2, canvasH * 0.2);

  ctx.fillStyle = '#222';
  ctx.font = `${Math.round(canvasH * 0.03)}px serif`;
  ctx.fillText('La Red Colombiana de Humanidades Digitales certifica que', canvasW/2, base);

  ctx.font = `bold ${Math.round(canvasH * 0.04)}px serif`;
  ctx.fillText(name, canvasW/2, base + (yUnit * 1.5));

  ctx.font = `${Math.round(canvasH * 0.03)}px serif`;
  ctx.fillText('Fue participante en la Maratón HD 2025 en las siguientes actividades:', canvasW/2, base + (yUnit * 3));

  ctx.font = `bold ${Math.round(canvasH * 0.03)}px serif`;
  ctx.textAlign = 'left';

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    const yPos = base + (yUnit * 5);
    drawWrappedText(ctx, title, (canvasW - maxTextWidth) / 2, yPos + (yUnit * 2 * i), maxTextWidth, lineHeight);
  }

  ctx.font = `${Math.round(canvasH * 0.03)}px serif`;
  ctx.textAlign = 'center';
  drawWrappedText(ctx, "La Maratón se realizó en la Universidad EAFIT y virtualmente los días 18 y 19 de septiembre de 2025", canvasW/2, base + (yUnit * 11), maxTextWidth, lineHeight);

  ctx.font = `${Math.round(canvasH * 0.02)}px serif`;
  drawWrappedText(ctx, "Puede verificar este certificado consultando la programación del evento en rchd.com.co/maraton", canvasW/2, base + (yUnit * 14), maxTextWidth, lineHeight);
}

async function makePdf() {
  const dataURL = canvas.toDataURL("image/png");
  
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [pageWidthMM, pageHeightMM]
  });

  pdf.addImage(dataURL, "PNG", 0, 0, pageWidthMM, pageHeightMM, undefined, 'FAST');
  pdf.save(`certificadoMaraton.pdf`);
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let testLine, metrics;

  for (let n = 0; n < words.length; n++) {
    testLine = line + words[n] + ' ';
    metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function drawLogo(ctx, url, x, y, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // required if logo comes from another domain with CORS enabled
    img.onload = () => {
      // Keep aspect ratio
      let w = img.width;
      let h = img.height;
      const scale = Math.min(maxWidth / w, maxHeight / h);
      w *= scale;
      h *= scale;
      ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
      resolve();
    };
    img.onerror = reject;
    img.src = url;
  });
}