import {
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFPage,
  StandardFonts,
  rgb,
  RGB
} from "pdf-lib";

const MARGIN = 52;
const CONTENT_LEFT = MARGIN + 28;
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

export function classificacaoQI(qi: number): string {
  if (qi > 130) return "Excepcional";
  if (qi >= 116) return "Excelente";
  if (qi >= 101) return "Muito bom";
  if (qi >= 85) return "Bom";
  return "Abaixo da média";
}

function percentil(qi: number): number {
  if (qi >= 145) return 99.9;
  if (qi >= 130) return 98;
  if (qi >= 120) return 91;
  if (qi >= 116) return 84;
  if (qi >= 110) return 75;
  if (qi >= 101) return 53;
  if (qi >= 95) return 37;
  if (qi >= 90) return 25;
  if (qi >= 85) return 16;
  if (qi >= 80) return 9;
  return Math.max(1, Math.min(8, Math.round((qi / 80) * 8)));
}

type PageContext = {
  page: PDFPage;
  width: number;
  height: number;
  fontR: ReturnType<PDFDocument["embedFont"]> extends Promise<infer T> ? T : never;
  fontB: ReturnType<PDFDocument["embedFont"]> extends Promise<infer T> ? T : never;
  textPrimary: RGB;
  textSecondary: RGB;
  lineAccent: RGB;
  borderLight: RGB;
  boxBg: RGB;
  emerald: RGB;
  /** Azul para títulos e subtítulos (certificado mais colorido) */
  tituloAzul: RGB;
  /** Borda azul que acompanha todo o quadrado da página (1–21) */
  borderAzul: RGB;
  contentWidth: number;
  borderPreto?: RGB;
  params: Params;
};

export type Params = {
  nome: string;
  acertos: number;
  totalPerguntas: number;
  qiEstimado: number;
  certificadoId: string;
  dataEmissao: string;
};

export type RelatorioPdfOptions = {
  /** Buffers PNG das imagens das questões 1–25 (pergunta-1.png … pergunta-25.png) */
  questionImageBuffers?: (Buffer | Uint8Array | null)[];
};

/** Desenha fundo branco e borda azul em todas as páginas (1–21), mais profissional */
function drawPageBackgroundAndBorder(ctx: PageContext) {
  const { page, width, height, borderAzul } = ctx;
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
  const m = MARGIN;
  const w = width - m * 2;
  const h = height - m * 2;
  page.drawRectangle({
    x: m,
    y: m,
    width: w,
    height: h,
    borderColor: borderAzul,
    borderWidth: 2
  });
  page.drawRectangle({
    x: m + 4,
    y: m + 4,
    width: w - 8,
    height: h - 8,
    borderColor: borderAzul,
    borderWidth: 0.5
  });
}

function drawPageFrame(ctx: PageContext, pageNum?: number) {
  const { page, width, height, fontB, textSecondary, tituloAzul } = ctx;
  drawPageBackgroundAndBorder(ctx);
  if (pageNum !== undefined) {
    page.drawText(`Página ${pageNum} de 21`, {
      x: width - MARGIN - 80,
      y: MARGIN + 24,
      size: 10,
      font: fontB,
      color: tituloAzul
    });
  }
}

function drawHeaderRelatorio(ctx: PageContext, yStart: number) {
  const { page, height, fontB, tituloAzul, lineAccent } = ctx;
  const y = height - MARGIN - yStart;
  page.drawText("IQ", {
    x: CONTENT_LEFT,
    y: y - 24,
    size: 26,
    font: fontB,
    color: tituloAzul
  });
  page.drawText("Relatório", {
    x: CONTENT_LEFT,
    y: y - 48,
    size: 14,
    font: fontB,
    color: tituloAzul
  });
  page.drawRectangle({
    x: CONTENT_LEFT,
    y: y - 56,
    width: 80,
    height: 1.5,
    color: lineAccent
  });
  return y - 72;
}

function drawFooter(ctx: PageContext, pageNum: number) {
  const { page, width, fontB, tituloAzul, params } = ctx;
  const y = MARGIN + 28;
  page.drawText("RELATÓRIO CONFIDENCIAL", {
    x: CONTENT_LEFT,
    y: y + 22,
    size: 8,
    font: fontB,
    color: tituloAzul
  });
  page.drawText(`ID: ${params.certificadoId}`, {
    x: CONTENT_LEFT,
    y: y + 10,
    size: 9,
    font: fontB,
    color: tituloAzul
  });
  page.drawText(`Emitido em: ${params.dataEmissao}`, {
    x: CONTENT_LEFT,
    y: y,
    size: 9,
    font: fontB,
    color: tituloAzul
  });
  page.drawText(`Página ${pageNum} de 21`, {
    x: width - CONTENT_LEFT - 70,
    y: y,
    size: 9,
    font: fontB,
    color: tituloAzul
  });
}

/** Desenha um bloco de texto com quebra de linha simples (por espaço) */
function drawParagraph(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  opts: { font: PDFFont; size: number; color: RGB; maxWidth: number }
) {
  const words = text.split(" ");
  const lineHeight = opts.size * 1.3;
  let line = "";
  let currentY = y;
  const { font, size, color, maxWidth } = opts;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    const lineWidth = font.widthOfTextAtSize(test, size);
    if (lineWidth > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size, font, color });
      currentY -= lineHeight;
      line = w;
    } else {
      line = test;
    }
  }
  if (line) {
    page.drawText(line, { x, y: currentY, size, font, color });
    currentY -= lineHeight;
  }
  return currentY;
}

/** Diagrama da capa: símbolo IQ ao centro (anel duplo) + 5 áreas cognitivas com linhas tracejadas */
function drawDiagramaIQCapa(
  page: PDFPage,
  centerX: number,
  centerY: number,
  areaNames: string[],
  opts: { fontB: PDFFont; fontR: PDFFont; tituloAzul: RGB; textPrimary: RGB }
) {
  const { fontB, fontR, tituloAzul, textPrimary } = opts;
  const radius = 54;
  const lineLen = 78;
  const labelFontSize = 11;
  const iqFontSize = 38;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const angles = [90, 18, -54, -126, -198];
  const blueDark = rgb(0.08, 0.18, 0.48);
  const blueRing = rgb(0.12, 0.22, 0.55);
  const blueLight = rgb(0.92, 0.94, 1);
  page.drawCircle({
    x: centerX,
    y: centerY,
    size: radius + 14,
    borderColor: blueDark,
    borderWidth: 2.5
  });
  page.drawCircle({
    x: centerX,
    y: centerY,
    size: radius + 6,
    borderColor: blueRing,
    borderWidth: 2,
    color: blueLight
  });
  page.drawCircle({
    x: centerX,
    y: centerY,
    size: radius,
    borderColor: tituloAzul,
    borderWidth: 2.5,
    color: rgb(1, 1, 1)
  });
  const iqW = fontB.widthOfTextAtSize("IQ", iqFontSize);
  page.drawText("IQ", {
    x: centerX - iqW / 2,
    y: centerY - iqFontSize / 2 - 2,
    size: iqFontSize,
    font: fontB,
    color: tituloAzul
  });
  for (let i = 0; i < Math.min(5, areaNames.length, angles.length); i++) {
    const ang = toRad(angles[i]);
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const x1 = centerX + radius * cos;
    const y1 = centerY + radius * sin;
    const x2 = centerX + (radius + lineLen) * cos;
    const y2 = centerY + (radius + lineLen) * sin;
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: 1,
      color: rgb(0.35, 0.4, 0.5),
      dashArray: [3, 3]
    });
    const label = (areaNames[i] ?? "").length > 24 ? (areaNames[i] ?? "").slice(0, 21) + "…" : (areaNames[i] ?? "");
    const labelW = fontB.widthOfTextAtSize(label, labelFontSize);
    const tx = centerX + (radius + lineLen) * cos;
    const ty = centerY + (radius + lineLen) * sin;
    page.drawText(label, {
      x: tx - labelW / 2,
      y: ty - labelFontSize / 2 - 1,
      size: labelFontSize,
      font: fontB,
      color: textPrimary
    });
  }
}

/** Círculo azul escuro com pontuação no centro (estilo referência: QI ou X/5) */
function drawCircleWithScore(
  page: PDFPage,
  centerX: number,
  centerY: number,
  radius: number,
  scoreText: string,
  opts: { font: PDFFont; fontSize: number; textColor: RGB; circleColor: RGB }
) {
  page.drawCircle({
    x: centerX,
    y: centerY,
    size: radius,
    color: opts.circleColor
  });
  const textW = opts.font.widthOfTextAtSize(scoreText, opts.fontSize);
  page.drawText(scoreText, {
    x: centerX - textW / 2,
    y: centerY - opts.fontSize / 2 - 2,
    size: opts.fontSize,
    font: opts.font,
    color: opts.textColor
  });
}

/** Gráfico de barras horizontais (estilo comparação internacional: rótulos à esquerda, barras à direita) */
function drawHorizontalBarChart(
  page: PDFPage,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    labels: string[];
    values: number[];
    minVal: number;
    maxVal: number;
    fontR: PDFFont;
    fontB: PDFFont;
    textColor: RGB;
    barColor: RGB;
    gridColor: RGB;
    getBarColor?: (value: number) => RGB;
    /** Se definido, desenha linhas entre linhas e colunas (estilo tabela p.11) e grelha não sobrepõe o eixo */
    rowBorderColor?: RGB;
  }
) {
  const { x, y, width, height, labels, values, minVal, maxVal, fontR, fontB, textColor, barColor, gridColor, getBarColor, rowBorderColor } = opts;
  const n = Math.min(labels.length, values.length);
  if (n === 0) return;
  const labelW = 145;
  const chartW = width - labelW - 40;
  const barH = Math.min(18, (height - 40) / n);
  const gap = 4;
  const range = maxVal - minVal || 1;
  const step = range <= 25 ? 5 : 10;
  const axisY = y - 14;
  const lastRowBottom = y + height - 28 - (n - 1) * (barH + gap);
  const gridTop = y + height - 24;
  const gridHeight = gridTop - lastRowBottom;
  for (let v = minVal; v <= maxVal; v += step) {
    const px = x + labelW + ((v - minVal) / range) * chartW;
    page.drawRectangle({
      x: px,
      y: lastRowBottom,
      width: 0.8,
      height: Math.max(0, gridHeight),
      color: gridColor
    });
  }
  for (let i = 0; i < n; i++) {
    const ly = y + height - 28 - i * (barH + gap);
    const label = (labels[i] ?? "").slice(0, 28);
    page.drawText(label, { x: x + 4, y: ly + barH / 2 - 5, size: 10, font: fontB, color: textColor });
    const barLen = Math.min(chartW - 4, Math.max(0, ((values[i] - minVal) / range) * (chartW - 4)));
    const corBarra = getBarColor ? getBarColor(values[i]) : barColor;
    page.drawRectangle({
      x: x + labelW + 2,
      y: ly,
      width: Math.max(2, barLen),
      height: barH - 2,
      color: corBarra
    });
    page.drawText(String(values[i]), {
      x: x + labelW + chartW + 6,
      y: ly + barH / 2 - 5,
      size: 10,
      font: fontB,
      color: textColor
    });
  }
  if (rowBorderColor) {
    const rowTop = y + height - 28 + barH - 1;
    page.drawRectangle({ x, y: rowTop, width, height: 1, color: rowBorderColor });
    for (let i = 0; i < n; i++) {
      const ly = y + height - 28 - i * (barH + gap);
      page.drawRectangle({ x, y: ly - 0.5, width, height: 1, color: rowBorderColor });
    }
    page.drawRectangle({ x: x + labelW - 0.5, y: y, width: 1, height: height - 24, color: rowBorderColor });
    page.drawRectangle({ x: x + labelW + chartW + 0.5, y: y, width: 1, height: height - 24, color: rowBorderColor });
  }
  for (let v = minVal; v <= maxVal; v += step) {
    const px = x + labelW + ((v - minVal) / range) * chartW;
    page.drawText(String(v), { x: px - 4, y: axisY, size: 9, font: fontB, color: textColor });
  }
}

/** Desenha uma imagem escalada para caber numa caixa (mantém proporção) */
function drawImageInBox(
  page: PDFPage,
  image: PDFImage,
  x: number,
  y: number,
  boxW: number,
  boxH: number
) {
  const imgW = image.width;
  const imgH = image.height;
  const scale = Math.min(boxW / imgW, boxH / imgH, 1);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const cx = x + (boxW - drawW) / 2;
  const cy = y + (boxH - drawH) / 2;
  page.drawImage(image, { x: cx, y: cy, width: drawW, height: drawH });
}

/** Desenha um gráfico de barras (barras verticais) */
function drawBarChart(
  page: PDFPage,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    labels: string[];
    values: number[]; // 0–1 ou 0–100 (normalizamos para altura)
    fontR: PDFFont;
    fontB: PDFFont;
    textColor: RGB;
    barColor: RGB;
    borderColor: RGB;
  }
) {
  const { x, y, width, height, labels, values, fontR, fontB, textColor, barColor, borderColor } = opts;
  const n = Math.min(labels.length, values.length);
  if (n === 0) return;
  const maxVal = Math.max(...values, 1);
  const barW = (width - (n + 1) * 8) / n;
  const chartH = height - 28;
  const barMaxH = chartH - 20;
  for (let i = 0; i < n; i++) {
    const bx = x + 8 + i * (barW + 8);
    const barHeight = (values[i] / maxVal) * barMaxH;
    const by = y + 20;
    page.drawRectangle({
      x: bx,
      y: by,
      width: barW,
      height: barMaxH,
      borderColor,
      borderWidth: 0.5
    });
    page.drawRectangle({
      x: bx + 2,
      y: by + 2,
      width: barW - 4,
      height: Math.max(4, barHeight - 2),
      color: barColor
    });
    const label = labels[i].length > 12 ? labels[i].slice(0, 10) + "…" : labels[i];
    page.drawText(label, {
      x: bx,
      y: by - 14,
      size: 8,
      font: fontB,
      color: textColor
    });
  }
}

/** Barra horizontal de percentil (0–100) */
function drawPercentileBar(
  page: PDFPage,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    percentil: number;
    fontR: PDFFont;
    fontB: PDFFont;
    textColor: RGB;
    fillColor: RGB;
    borderColor: RGB;
  }
) {
  const { x, y, width, height, percentil, fontR, fontB, textColor, fillColor, borderColor } = opts;
  const pct = Math.min(100, Math.max(0, percentil)) / 100;
  page.drawRectangle({ x, y, width, height, borderColor, borderWidth: 0.5 });
  page.drawRectangle({
    x: x + 2,
    y: y + 2,
    width: (width - 4) * pct,
    height: height - 4,
    color: fillColor
  });
  page.drawText(`Você está aqui: percentil ${Math.round(percentil)}`, {
    x: x,
    y: y + height + 6,
    size: 10,
    font: fontB,
    color: textColor
  });
}

/** Escala de QI como gráfico visual (faixas horizontais com rótulos) */
function drawEscalaQIGrafico(
  page: PDFPage,
  opts: {
    x: number;
    y: number;
    width: number;
    fontR: PDFFont;
    fontB: PDFFont;
    textColor: RGB;
    tituloAzul: RGB;
  }
) {
  const { x, y, width, fontR, fontB, textColor, tituloAzul } = opts;
  const barH = 28;
  const rightEdge = x + width;
  const faixas = [
    { min: 70, max: 84, label: "70-84 Abaixo", cor: rgb(0.95, 0.8, 0.8) },
    { min: 85, max: 100, label: "85-100 Média", cor: rgb(0.9, 0.92, 0.98) },
    { min: 101, max: 115, label: "101-115 Acima", cor: rgb(0.85, 0.9, 0.95) },
    { min: 116, max: 130, label: "116-130 Superior", cor: rgb(0.75, 0.85, 0.95) },
    { min: 131, max: 145, label: "131+ Muito superior", cor: rgb(0.6, 0.78, 0.95) }
  ];
  const total = faixas.reduce((acc, f) => acc + (f.max - f.min + 1), 0);
  let cx = x;
  page.drawText("Escala de QI (referência)", { x, y: y + barH + 18, size: 11, font: fontB, color: tituloAzul });
  page.drawRectangle({ x, y, width, height: barH, borderColor: rgb(0.7, 0.75, 0.85), borderWidth: 0.5 });
  const lineHeight = 12;
  const labelY = y - 14;
  const overflowLabels: string[] = [];
  for (let i = 0; i < faixas.length; i++) {
    const f = faixas[i];
    const segWidth = f.max - f.min + 1;
    const w = (width * segWidth) / total;
    const gap = i < faixas.length - 1 ? 0.5 : 0;
    const rectW = Math.max(1, Math.min(w - gap, rightEdge - cx - 1));
    page.drawRectangle({ x: cx, y: y + 1, width: rectW, height: barH - 2, color: f.cor });
    const labelW = fontR.widthOfTextAtSize(f.label, 9);
    const labelX = cx + (w - labelW) / 2 - 0.25;
    if (labelX + labelW <= rightEdge && labelX >= x) {
      page.drawText(f.label, { x: labelX, y: labelY, size: 9, font: fontR, color: textColor });
    } else {
      overflowLabels.push(f.label);
    }
    cx += w;
  }
  if (overflowLabels.length > 0) {
    const segundaLinha = labelY - lineHeight;
    const textoExtra = overflowLabels.join("  •  ");
    const textoW = fontR.widthOfTextAtSize(textoExtra, 9);
    if (textoW <= width) {
      page.drawText(textoExtra, { x, y: segundaLinha, size: 9, font: fontR, color: textColor });
    } else {
      drawParagraph(page, textoExtra, x, segundaLinha, { font: fontR, size: 9, color: textColor, maxWidth: width });
    }
  }
}

/** Tabela estilo planilha: headers + rows, com bordas */
function drawTable(
  page: PDFPage,
  opts: {
    x: number;
    y: number;
    colWidths: number[];
    headers: string[];
    rows: string[][];
    rowHeight: number;
    fontR: PDFFont;
    fontB: PDFFont;
    textColor: RGB;
    headerBg: RGB;
    borderColor: RGB;
    borderWidth?: number;
  }
) {
  const { x, y, colWidths, headers, rows, rowHeight, fontR, fontB, textColor, headerBg, borderColor, borderWidth = 1 } = opts;
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  let currentY = y;
  for (let col = 0, cx = x; col < headers.length; col++) {
    const cw = colWidths[col] ?? totalW / headers.length;
    page.drawRectangle({
      x: cx,
      y: currentY - rowHeight,
      width: cw,
      height: rowHeight,
      borderColor,
      borderWidth,
      color: headerBg
    });
    const text = (headers[col] ?? "").slice(0, 25);
    page.drawText(text, { x: cx + 5, y: currentY - rowHeight + 5, size: 10, font: fontB, color: textColor });
    cx += cw;
  }
  currentY -= rowHeight;
  for (const row of rows) {
    for (let col = 0, cx = x; col < row.length; col++) {
      const cw = colWidths[col] ?? totalW / headers.length;
      page.drawRectangle({
        x: cx,
        y: currentY - rowHeight,
        width: cw,
        height: rowHeight,
        borderColor,
        borderWidth
      });
      const text = (row[col] ?? "").slice(0, 28);
      page.drawText(text, { x: cx + 5, y: currentY - rowHeight + 5, size: 9, font: fontB, color: textColor });
      cx += cw;
    }
    currentY -= rowHeight;
  }
}

// Áreas cognitivas (5 blocos de 5 questões para o relatório)
const AREAS = [
  { nome: "Percepção Visual", questoes: "1–5", descricao: "Capacidade de interpretar e organizar informação visual." },
  { nome: "Raciocínio Abstrato", questoes: "6–10", descricao: "Capacidade de identificar padrões e regras lógicas." },
  { nome: "Reconhecimento de Padrões", questoes: "11–15", descricao: "Capacidade de detectar sequências e relações." },
  { nome: "Orientação Espacial", questoes: "16–20", descricao: "Capacidade de manipular formas e posições no espaço." },
  { nome: "Pensamento Analítico", questoes: "21–23", descricao: "Capacidade de análise lógica e dedução." }
];

/** Textos descritivos por qualidade (páginas 6–10, estilo referência: valor em texto da qualidade) */
const AREA_TEXTO_QUALIDADE: string[][] = [
  [
    "O processamento visual-espacial (ou raciocínio perceptivo) é a capacidade de reconhecer e visualizar a orientação de objetos, compreender as suas relações e introduzir lógica em padrões visuais. Trata-se de uma competência que permite organizar, processar e interpretar informação visual e extrair significado do que se vê.",
    "A percepção visual é central na inteligência humana e fundamental para a aquisição de novos conhecimentos. A ciência mostra que as crianças aprendem mais depressa e retêm o conhecimento com mais precisão quando professores e materiais utilizam imagens, evidenciando a eficácia desta técnica na aprendizagem de vocabulário, matemática e outras áreas.",
    "O processamento visual-espacial é uma qualidade cognitiva fundamental para a aprendizagem, a carreira e as conquistas pessoais. Pode ser treinado e melhorado através da prática com questões que avaliam a clareza com que se percebem objetos no espaço e as suas posições relativas."
  ],
  [
    "O raciocínio lógico (ou raciocínio fluido/dedutivo) é a capacidade de pensar de forma lógica e resolver problemas em situações novas, independentemente do conhecimento adquirido. Este construto é central nas teorias da inteligência humana.",
    "A tomada de decisão lógica baseia-se na formulação de premissas coerentes e na extração de conclusões a partir delas. As questões de raciocínio lógico avaliam o pensamento cognitivo e analítico e a inteligência geral, testando a capacidade de reconhecer padrões racionais e resolver desafios. A pontuação indica a destreza em analisar informação e tomar decisões racionais.",
    "A capacidade de raciocínio lógico apresenta a maior correlação com a identificação e resolução de problemas e está fortemente associada ao sucesso académico e profissional."
  ],
  [
    "O raciocínio quantitativo é a inteligência numérica e matemática, associada ao sentido para números, cálculos, medições, geometria, análise de probabilidades e estatística. Inclui a capacidade de reconhecer padrões numéricos e compreender operações como adição, subtração, multiplicação e divisão.",
    "As questões de reconhecimento de padrões no teste avaliam a capacidade de detectar sequências, relações e regularidades em conjuntos de elementos. Esta competência está ligada à fluência em raciocínio abstracto e à capacidade de generalizar regras a partir de exemplos.",
    "O raciocínio quantitativo e o reconhecimento de padrões são competências que todos possuem em algum grau e que podem ser melhoradas. Desenvolver a inteligência lógico-matemática é mais acessível do que muitas vezes se supõe, através da prática com jogos de estratégia, puzzles e exercícios numéricos."
  ],
  [
    "A memória de trabalho é um sistema cognitivo de capacidade limitada que armazena temporariamente informação e é essencial para o raciocínio, a tomada de decisões e o comportamento. Funciona como um «lembrete» temporário que nos permite processar e relacionar informação.",
    "A orientação espacial está ligada às competências de memória de curto prazo e à capacidade de manipular a informação armazenada. É um conceito central na psicologia, neuropsicologia e neurociência modernas. A capacidade da memória de trabalho varia entre indivíduos; a maioria dos adultos armazena cerca de sete itens, mas com treino intensivo alguns podem armazenar muito mais.",
    "A memória de trabalho e a orientação espacial são fundamentais para tarefas que exigem manter várias informações «em mente» ao mesmo tempo e para manipular formas e posições no espaço. Podem ser treinadas através de exercícios específicos e da prática com questões visuoespaciais."
  ],
  [
    "A capacidade criativa é a capacidade de considerar as coisas de uma forma nova, incluindo análise, abertura de espírito, organização e resolução de problemas. Os empregadores valorizam quem pensa de forma criativa; convém destacar estas competências no currículo e em entrevistas.",
    "As pessoas altamente criativas abordam as ideias de múltiplas perspetivas, analisam a forma como as suas soluções se enquadram no âmbito do trabalho e estão abertas a riscos e a ideias novas. Desenvolver, testar e implementar ideias originais torna-as valiosas em qualquer ambiente de trabalho.",
    "Todos podemos ser criativos; o pensamento criativo precisa de ser praticado para desenvolver ideias e obras originais. O pensamento analítico e a capacidade criativa estão no centro da inteligência geral e podem ser cultivados através da prática e da reflexão."
  ]
];

function acertosPorArea(acertos: number, total: number): number[] {
  const n = AREAS.length;
  const areaSizes = [5, 5, 5, 5, Math.max(0, total - 20)];
  const base = Math.floor(acertos / n);
  const rest = acertos % n;
  const arr = areaSizes.map((size) => Math.min(size, base));
  for (let i = 0; i < rest; i++) {
    const idx = i % n;
    arr[idx] = Math.min(areaSizes[idx] ?? 0, (arr[idx] ?? 0) + 1);
  }
  return arr;
}

export async function gerarRelatorioPdf21Paginas(
  params: Params,
  options?: RelatorioPdfOptions
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const fontR = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const textPrimary = rgb(0.1, 0.1, 0.15);
  const textSecondary = rgb(0.35, 0.38, 0.45);
  const lineAccent = rgb(0.25, 0.25, 0.6);
  const borderLight = rgb(0.88, 0.89, 0.92);
  const boxBg = rgb(0.97, 0.97, 0.98);
  const emerald = rgb(0.13, 0.5, 0.32);
  /** Azul escuro para círculos de pontuação (estilo referência) */
  const darkBlueCircle = rgb(0.1, 0.12, 0.42);
  const white = rgb(1, 1, 1);
  /** Azul para títulos e subtítulos (certificado mais colorido) */
  const tituloAzul = rgb(0.08, 0.18, 0.52);
  /** Borda azul em todas as páginas (linhas bonitas e chamativas) */
  const borderAzul = rgb(0.12, 0.22, 0.55);
  /** Linhas pretas fortes para tabelas e caixas (divisão clara, sem aspecto apagado) */
  const borderPreto = rgb(0.18, 0.18, 0.22);

  const width = A4_WIDTH;
  const height = A4_HEIGHT;
  const contentWidth = width - MARGIN * 2 - 56;

  const ctx: PageContext = {
    page: null as unknown as PDFPage,
    width,
    height,
    fontR,
    fontB,
    textPrimary,
    textSecondary,
    lineAccent,
    borderLight,
    boxBg,
    emerald,
    tituloAzul,
    borderAzul,
    borderPreto,
    contentWidth,
    params
  };

  const classificacao = classificacaoQI(params.qiEstimado);
  const percentilVal = percentil(params.qiEstimado);
  const acertosPorAreaArr = acertosPorArea(params.acertos, params.totalPerguntas);

  // ——— PÁGINA 1: Capa (com diagrama IQ ao centro) ———
  const p1 = pdfDoc.addPage([width, height]);
  ctx.page = p1;
  drawPageFrame(ctx);
  p1.drawText("IQ", { x: CONTENT_LEFT, y: height - MARGIN - 56, size: 36, font: fontB, color: tituloAzul });
  p1.drawText("Relatório", { x: CONTENT_LEFT, y: height - MARGIN - 92, size: 18, font: fontB, color: tituloAzul });
  p1.drawRectangle({ x: CONTENT_LEFT, y: height - MARGIN - 104, width: 100, height: 2, color: lineAccent });
  const capaCenterX = width / 2;
  const capaCenterY = height / 2 + 25;
  drawDiagramaIQCapa(p1, capaCenterX, capaCenterY, AREAS.map((a) => a.nome), {
    fontB,
    fontR,
    tituloAzul,
    textPrimary
  });
  const candY = MARGIN + 140;
  p1.drawText("Candidato", { x: CONTENT_LEFT, y: candY, size: 12, font: fontB, color: tituloAzul });
  p1.drawText(params.nome, { x: CONTENT_LEFT, y: candY - 32, size: 24, font: fontB, color: textPrimary });
  p1.drawText(params.dataEmissao, { x: CONTENT_LEFT, y: candY - 64, size: 12, font: fontB, color: tituloAzul });
  drawFooter(ctx, 1);

  // ——— PÁGINA 2: Índice ———
  const p2 = pdfDoc.addPage([width, height]);
  ctx.page = p2;
  drawPageBackgroundAndBorder(ctx);
  let y2 = drawHeaderRelatorio(ctx, 8);
  p2.drawText("Índice", { x: CONTENT_LEFT, y: y2, size: 18, font: fontB, color: tituloAzul });
  y2 -= 40;
  const indice = [
    "1. Capa",
    "2. Índice",
    "3. Introdução",
    "4. A sua pontuação de QI",
    "5. Visão geral da avaliação",
    "6. Percepção Visual",
    "7. Raciocínio Abstrato",
    "8. Reconhecimento de Padrões",
    "9. Orientação Espacial",
    "10. Pensamento Analítico",
    "11. Detalhamento por questão",
    "12. Comparação com a população",
    "13. Pontos fortes e áreas de melhoria",
    "14. Análise aprofundada",
    "15. Desempenho por área",
    "16. Recomendações personalizadas",
    "17. Conclusão",
    "18. Metodologia do teste",
    "19. Glossário",
    "20. Referências",
    "21. Certificado de verificação"
  ];
  for (const line of indice) {
    p2.drawText(line, { x: CONTENT_LEFT, y: y2, size: 11, font: fontB, color: textPrimary });
    y2 -= 22;
  }
  drawFooter(ctx, 2);

  // ——— PÁGINA 3: Introdução ———
  const p3 = pdfDoc.addPage([width, height]);
  ctx.page = p3;
  drawPageBackgroundAndBorder(ctx);
  y2 = drawHeaderRelatorio(ctx, 8);
  p3.drawText("Introdução", { x: CONTENT_LEFT, y: y2, size: 18, font: fontB, color: tituloAzul });
  y2 -= 36;
  const intro =
    "Este relatório apresenta os resultados do seu Teste de QI Profissional. O teste avalia a inteligência através de questões de raciocínio visual e abstracto, distribuídas em várias áreas cognitivas. " +
    "O QI (quociente de inteligência) é uma medida padronizada que compara o seu desempenho com a população em geral. " +
    "As secções seguintes detalham a sua pontuação global, o desempenho por área e a interpretação dos resultados.";
  y2 = drawParagraph(p3, intro, CONTENT_LEFT, y2, { font: fontB, size: 12, color: textPrimary, maxWidth: contentWidth });
  y2 -= 28;
  p3.drawText("Objetivos do relatório:", { x: CONTENT_LEFT, y: y2, size: 13, font: fontB, color: tituloAzul });
  y2 -= 26;
  const objetivos = [
    "• Apresentar a sua pontuação de QI e classificação.",
    "• Detalhar o desempenho em cada área cognitiva.",
    "• Comparar os seus resultados com a população.",
    "• Fornecer recomendações personalizadas."
  ];
  for (const o of objetivos) {
    p3.drawText(o, { x: CONTENT_LEFT, y: y2, size: 11, font: fontB, color: textPrimary });
    y2 -= 20;
  }
  drawFooter(ctx, 3);

  // ——— PÁGINA 4: A sua pontuação de QI (círculo grande + classificação, estilo referência) ———
  const p4 = pdfDoc.addPage([width, height]);
  ctx.page = p4;
  drawPageBackgroundAndBorder(ctx);
  y2 = drawHeaderRelatorio(ctx, 8);
  p4.drawText("A sua pontuação de QI", { x: CONTENT_LEFT, y: y2, size: 14, font: fontB, color: tituloAzul });
  y2 -= 32;
  const circleY4 = y2 - 55;
  const radius4 = 52;
  const centerX4 = CONTENT_LEFT + radius4 + 20;
  drawCircleWithScore(p4, centerX4, circleY4, radius4, String(params.qiEstimado), {
    font: fontB,
    fontSize: 44,
    textColor: white,
    circleColor: darkBlueCircle
  });
  y2 = circleY4 - radius4 - 20;
  p4.drawText(classificacao, { x: CONTENT_LEFT, y: y2, size: 18, font: fontB, color: darkBlueCircle });
  y2 -= 40;
  p4.drawRectangle({
    x: CONTENT_LEFT,
    y: y2 - 54,
    width: contentWidth,
    height: 56,
    borderColor: borderLight,
    borderWidth: 1,
    color: boxBg
  });
  p4.drawText("Pontuação no teste", { x: CONTENT_LEFT + 18, y: y2 - 24, size: 11, font: fontB, color: tituloAzul });
  p4.drawText(`${params.acertos} de ${params.totalPerguntas} questões corretas`, {
    x: CONTENT_LEFT + 18,
    y: y2 - 46,
    size: 13,
    font: fontB,
    color: textPrimary
  });
  drawFooter(ctx, 4);

  // ——— PÁGINA 5: Visão geral da avaliação ———
  const p5 = pdfDoc.addPage([width, height]);
  ctx.page = p5;
  drawPageBackgroundAndBorder(ctx);
  y2 = drawHeaderRelatorio(ctx, 8);
  p5.drawText("Visão geral da avaliação", { x: CONTENT_LEFT, y: y2, size: 18, font: fontB, color: tituloAzul });
  y2 -= 40;
  p5.drawText("Resumo por área cognitiva", { x: CONTENT_LEFT, y: y2, size: 13, font: fontB, color: tituloAzul });
  y2 -= 30;
  const areaSizes = [5, 5, 5, 5, Math.max(0, params.totalPerguntas - 20)];
  for (let i = 0; i < AREAS.length; i++) {
    const a = AREAS[i];
    const ac = acertosPorAreaArr[i];
    const denom = areaSizes[i] ?? 0;
    p5.drawText(`${a.nome}: ${ac}/${denom}`, { x: CONTENT_LEFT, y: y2, size: 12, font: fontB, color: textPrimary });
    y2 -= 24;
  }
  y2 -= 18;
  p5.drawText(`Pontuação total: ${params.acertos}/${params.totalPerguntas}`,
 {
    x: CONTENT_LEFT,
    y: y2,
    size: 13,
    font: fontB,
    color: textPrimary
  });
  y2 -= 32;
  p5.drawText("As secções 6 a 10 detalham cada área.", { x: CONTENT_LEFT, y: y2, size: 11, font: fontB, color: tituloAzul });
  drawFooter(ctx, 5);

  // ——— PÁGINAS 6–10: Uma página por qualidade (círculo X/5 + texto descritivo; sem imagens das perguntas, estilo referência) ———
  const areaCircleRadius = 40;
  const areaSizesPages = [5, 5, 5, 5, Math.max(0, params.totalPerguntas - 20)];
  for (let idx = 0; idx < AREAS.length; idx++) {
    const p = pdfDoc.addPage([width, height]);
    ctx.page = p;
    drawPageBackgroundAndBorder(ctx);
    const pageNum = 6 + idx;
    y2 = drawHeaderRelatorio(ctx, 8);
    const area = AREAS[idx];
    const ac = acertosPorAreaArr[idx];
    p.drawText(area.nome, { x: CONTENT_LEFT, y: y2, size: 18, font: fontB, color: darkBlueCircle });
    y2 -= 28;
    const areaCircleY = y2 - areaCircleRadius - 10;
    const centerX = CONTENT_LEFT + contentWidth / 2;
    const denom = areaSizesPages[idx] ?? 0;
    drawCircleWithScore(p, centerX, areaCircleY, areaCircleRadius, `${ac}/${denom}`, {
      font: fontB,
      fontSize: 24,
      textColor: white,
      circleColor: darkBlueCircle
    });
    y2 = areaCircleY - areaCircleRadius - 24;
    const paragrafos = AREA_TEXTO_QUALIDADE[idx] ?? [];
    for (const par of paragrafos) {
      y2 = drawParagraph(p, par, CONTENT_LEFT, y2, { font: fontB, size: 11, color: textPrimary, maxWidth: contentWidth });
      y2 -= 14;
    }
    drawFooter(ctx, pageNum);
  }

  // ——— PÁGINA 11: Detalhamento por questão (tabela tipo planilha) ———
  const p11 = pdfDoc.addPage([width, height]);
  ctx.page = p11;
  drawPageBackgroundAndBorder(ctx);
  y2 = drawHeaderRelatorio(ctx, 8);
  p11.drawText("Detalhamento por questão", { x: CONTENT_LEFT, y: y2, size: 16, font: fontB, color: tituloAzul });
  y2 -= 32;
  p11.drawText(
    `O teste é composto por ${params.totalPerguntas} questões. Você respondeu corretamente a ${params.acertos} questões.`,
    { x: CONTENT_LEFT, y: y2, size: 12, font: fontB, color: textPrimary }
  );
  y2 -= 32;
  const colWidths11 = [contentWidth * 0.4, contentWidth * 0.2, contentWidth * 0.2, contentWidth * 0.2];
  drawTable(p11, {
    x: CONTENT_LEFT,
    y: y2,
    colWidths: colWidths11,
    headers: ["Área cognitiva", "Questões", "Corretas", "%"],
    rows: AREAS.map((a, i) => [
      a.nome,
      a.questoes,
      String(acertosPorAreaArr[i]),
      `${Math.round((acertosPorAreaArr[i] / Math.max(1, areaSizes[i] ?? 1)) * 100)}%`
    ]),
    rowHeight: 26,
    fontR,
    fontB,
    textColor: textPrimary,
    headerBg: boxBg,
    borderColor: borderPreto,
    borderWidth: 1
  });
  drawFooter(ctx, 11);

  // ——— PÁGINA 12: Comparação com a população (percentil + gráfico horizontal estilo referência) ———
  const p12 = pdfDoc.addPage([width, height]);
  ctx.page = p12;
  drawPageBackgroundAndBorder(ctx);
  y2 = drawHeaderRelatorio(ctx, 8);
  p12.drawText("Comparação com a população", { x: CONTENT_LEFT, y: y2, size: 16, font: fontB, color: tituloAzul });
  y2 -= 36;
  p12.drawText(`O seu QI de ${params.qiEstimado} situa-o no percentil ${percentilVal}.`, {
    x: CONTENT_LEFT,
    y: y2,
    size: 12,
    font: fontB,
    color: textPrimary
  });
  y2 -= 28;
  drawPercentileBar(p12, {
    x: CONTENT_LEFT,
    y: y2 - 28,
    width: contentWidth,
    height: 24,
    percentil: percentilVal,
    fontR,
    fontB,
    textColor: textPrimary,
    fillColor: darkBlueCircle,
    borderColor: borderPreto
  });
  y2 -= 68;
  p12.drawText("Comparação com média de QI por país (referência)", {
    x: CONTENT_LEFT,
    y: y2,
    size: 12,
    font: fontB,
    color: tituloAzul
  });
  y2 -= 14;
  const paises = [
    "Cingapura",
    "Noruega",
    "Estados Unidos",
    "Suécia",
    "Japão",
    "Austrália",
    "Reino Unido",
    "China",
    "Emirados Árabes",
    "Alemanha"
  ];
  const paisesQI = [109, 108, 108, 107, 106, 106, 106, 105, 105, 104];
  const userRow = "O seu resultado";
  const allLabels = [...paises, userRow];
  const allValues = [...paisesQI, params.qiEstimado];
  const minQI = Math.min(90, ...allValues) - 2;
  const maxQI = Math.max(110, ...allValues) + 2;
  const chartX12 = CONTENT_LEFT;
  const chartY12 = y2 - 220;
  const chartW12 = contentWidth;
  const chartH12 = 228;
  const corBarraPorQI = (qi: number): RGB => {
    if (qi <= 84) return rgb(0.95, 0.8, 0.8);
    if (qi <= 100) return rgb(0.9, 0.92, 0.98);
    if (qi <= 115) return rgb(0.85, 0.9, 0.95);
    if (qi <= 130) return rgb(0.75, 0.85, 0.95);
    return rgb(0.6, 0.78, 0.95);
  };
  p12.drawRectangle({
    x: chartX12,
    y: chartY12 - 22,
    width: chartW12,
    height: chartH12 + 26,
    borderColor: borderPreto,
    borderWidth: 1.5
  });
  drawHorizontalBarChart(p12, {
    x: chartX12,
    y: chartY12,
    width: chartW12,
    height: chartH12,
    labels: allLabels,
    values: allValues,
    minVal: minQI,
    maxVal: maxQI,
    fontR,
    fontB,
    textColor: textPrimary,
    barColor: darkBlueCircle,
    gridColor: borderPreto,
    getBarColor: corBarraPorQI,
    rowBorderColor: borderPreto
  });
  y2 -= 248;
  const escalaY = y2 - 90;
  drawEscalaQIGrafico(p12, {
    x: CONTENT_LEFT,
    y: escalaY,
    width: contentWidth,
    fontR,
    fontB,
    textColor: textPrimary,
    tituloAzul
  });
  drawFooter(ctx, 12);

  // ——— PÁGINA 13: Pontos fortes e áreas de melhoria ———
  const p13 = pdfDoc.addPage([width, height]);
  ctx.page = p13;
  drawPageBackgroundAndBorder(ctx);
  y2 = drawHeaderRelatorio(ctx, 8);
  p13.drawText("Pontos fortes e áreas de melhoria", { x: CONTENT_LEFT, y: y2, size: 16, font: fontB, color: tituloAzul });
  y2 -= 40;
  const melhorArea = acertosPorAreaArr.indexOf(Math.max(...acertosPorAreaArr));
  const piorArea = acertosPorAreaArr.indexOf(Math.min(...acertosPorAreaArr));
  p13.drawText(`Ponto forte: ${AREAS[melhorArea].nome}`, { x: CONTENT_LEFT, y: y2, size: 13, font: fontB, color: tituloAzul });
  y2 -= 28;
  const textoPontoForte = AREAS[melhorArea].descricao + " O seu resultado nesta área está acima da média do teste.";
  y2 = drawParagraph(p13, textoPontoForte, CONTENT_LEFT, y2, { font: fontB, size: 11, color: textPrimary, maxWidth: contentWidth });
  y2 -= 32;
  p13.drawText(`Área de melhoria: ${AREAS[piorArea].nome}`, { x: CONTENT_LEFT, y: y2, size: 13, font: fontB, color: tituloAzul });
  y2 -= 28;
  y2 = drawParagraph(p13, "Praticar mais exercícios desta natureza pode ajudar a equilibrar o seu perfil cognitivo.", CONTENT_LEFT, y2, { font: fontB, size: 11, color: textPrimary, maxWidth: contentWidth });
  drawFooter(ctx, 13);

  // ——— PÁGINA 14: Análise aprofundada ———
  const p14 = pdfDoc.addPage([width, height]);
  ctx.page = p14;
  drawPageBackgroundAndBorder(ctx);
  y2 = drawHeaderRelatorio(ctx, 8);
  p14.drawText("Análise aprofundada", { x: CONTENT_LEFT, y: y2, size: 16, font: fontB, color: tituloAzul });
  y2 -= 36;
  const analise =
    "A classificação \"" +
    classificacao +
    "\" reflete o seu desempenho global no teste. " +
    "Este resultado é uma estimativa baseada nas respostas dadas e deve ser interpretado como um indicador geral de capacidade de raciocínio, " +
    "e não como uma medida absoluta da inteligência. Factores como o contexto do teste, o tempo disponível e a familiaridade com o tipo de questões podem influenciar o resultado.";
  y2 = drawParagraph(p14, analise, CONTENT_LEFT, y2, { font: fontB, size: 11, color: textPrimary, maxWidth: contentWidth });
  drawFooter(ctx, 14);

  // ——— PÁGINA 15: Desempenho por área (gráfico horizontal estilo referência + planilha) ———
  const p15 = pdfDoc.addPage([width, height]);
  ctx.page = p15;
  drawPageBackgroundAndBorder(ctx);
  y2 = drawHeaderRelatorio(ctx, 8);
  p15.drawText("Desempenho por área", { x: CONTENT_LEFT, y: y2, size: 16, font: fontB, color: tituloAzul });
  y2 -= 36;
  p15.drawText("Gráfico de desempenho (%)", { x: CONTENT_LEFT, y: y2, size: 12, font: fontB, color: tituloAzul });
  y2 -= 16;
  const areaPcts = acertosPorAreaArr.map((ac, i) => Math.round((ac / Math.max(1, areaSizes[i] ?? 1)) * 100));
  drawHorizontalBarChart(p15, {
    x: CONTENT_LEFT,
    y: y2 - 148,
    width: contentWidth,
    height: 155,
    labels: AREAS.map((a) => a.nome),
    values: areaPcts,
    minVal: 0,
    maxVal: 100,
    fontR,
    fontB,
    textColor: textPrimary,
    barColor: darkBlueCircle,
    gridColor: borderPreto
  });
  y2 -= 172;
  p15.drawText("Resumo em tabela", { x: CONTENT_LEFT, y: y2, size: 12, font: fontB, color: tituloAzul });
  y2 -= 28;
  const colWidths15 = [contentWidth * 0.5, contentWidth * 0.25, contentWidth * 0.25];
  drawTable(p15, {
    x: CONTENT_LEFT,
    y: y2,
    colWidths: colWidths15,
    headers: ["Área", "Corretas", "%"],
    rows: AREAS.map((a, i) => [
      a.nome,
      `${acertosPorAreaArr[i]}/5`,
      `${areaPcts[i]}%`
    ]),
    rowHeight: 24,
    fontR,
    fontB,
    textColor: textPrimary,
    headerBg: boxBg,
    borderColor: borderPreto,
    borderWidth: 1
  });
  drawFooter(ctx, 15);

  // ——— PÁGINA 16: Recomendações personalizadas ———
  const p16 = pdfDoc.addPage([width, height]);
  ctx.page = p16;
  drawPageBackgroundAndBorder(ctx);
  y2 = drawHeaderRelatorio(ctx, 8);
  p16.drawText("Recomendações personalizadas", { x: CONTENT_LEFT, y: y2, size: 16, font: fontB, color: tituloAzul });
  y2 -= 36;
  const recs =
    params.qiEstimado >= 101
      ? [
          "• Continuar a desafiar-se com exercícios de raciocínio para manter o nível.",
          "• Explorar áreas em que obteve menor pontuação para um perfil mais equilibrado.",
          "• Considerar partilhar os resultados com um profissional se pretender aprofundar a interpretação."
        ]
      : [
          "• Praticar regularmente testes de raciocínio visual e lógico.",
          "• Dedicar mais tempo a cada questão para reduzir erros por pressa.",
          "• Repetir o teste no futuro para acompanhar a evolução."
        ];
  for (const r of recs) {
    y2 = drawParagraph(p16, r, CONTENT_LEFT, y2, { font: fontB, size: 11, color: textPrimary, maxWidth: contentWidth });
    y2 -= 10;
  }
  drawFooter(ctx, 16);

  // ——— PÁGINA 17: Conclusão ———
  const p17 = pdfDoc.addPage([width, height]);
  ctx.page = p17;
  drawPageBackgroundAndBorder(ctx);
  y2 = drawHeaderRelatorio(ctx, 8);
  p17.drawText("Conclusão", { x: CONTENT_LEFT, y: y2, size: 16, font: fontB, color: tituloAzul });
  y2 -= 36;
  const conc =
    "Este relatório apresentou os resultados do seu Teste de QI Profissional, incluindo a pontuação de QI (" +
    params.qiEstimado +
    "), a classificação (" +
    classificacao +
    ") e o desempenho por área cognitiva. " +
    "Obrigado por concluir o teste. Para qualquer dúvida sobre a interpretação, consulte as secções anteriores ou a metodologia.";
  y2 = drawParagraph(p17, conc, CONTENT_LEFT, y2, { font: fontB, size: 11, color: textPrimary, maxWidth: contentWidth });
  drawFooter(ctx, 17);

  // ——— PÁGINA 18: Metodologia do teste ———
  const p18 = pdfDoc.addPage([width, height]);
  ctx.page = p18;
  drawPageBackgroundAndBorder(ctx);
  y2 = drawHeaderRelatorio(ctx, 8);
  p18.drawText("Metodologia do teste", { x: CONTENT_LEFT, y: y2, size: 16, font: fontB, color: tituloAzul });
  y2 -= 36;
  const met =
    "O teste é composto por " +
    params.totalPerguntas +
    " questões de raciocínio visual (matrizes), com tempo limitado por questão. " +
    "O QI é estimado a partir da percentagem de respostas corretas, utilizando uma curva de normalização. " +
    "As áreas cognitivas (Percepção Visual, Raciocínio Abstrato, Reconhecimento de Padrões, Orientação Espacial e Pensamento Analítico) agrupam as questões em blocos de 5 para fins de análise. " +
    "Este relatório é gerado automaticamente e tem carácter informativo.";
  y2 = drawParagraph(p18, met, CONTENT_LEFT, y2, { font: fontB, size: 11, color: textPrimary, maxWidth: contentWidth });
  drawFooter(ctx, 18);

  // ——— PÁGINA 19: Glossário ———
  const p19 = pdfDoc.addPage([width, height]);
  ctx.page = p19;
  drawPageBackgroundAndBorder(ctx);
  y2 = drawHeaderRelatorio(ctx, 8);
  p19.drawText("Glossário", { x: CONTENT_LEFT, y: y2, size: 16, font: fontB, color: tituloAzul });
  y2 -= 36;
  const glossario = [
    "QI (Quociente de Inteligência): Medida padronizada que compara o desempenho com a população.",
    "Percentil: Percentagem da população que obteve resultado inferior ao seu.",
    "Área cognitiva: Conjunto de capacidades relacionadas (ex.: raciocínio visual, espacial).",
    "Classificação: Etiqueta descritiva do nível (ex.: Bom, Excelente) associada a um intervalo de QI."
  ];
  for (const g of glossario) {
    y2 = drawParagraph(p19, g, CONTENT_LEFT, y2, { font: fontB, size: 11, color: textPrimary, maxWidth: contentWidth });
    y2 -= 14;
  }
  drawFooter(ctx, 19);

  // ——— PÁGINA 20: Referências ———
  const p20 = pdfDoc.addPage([width, height]);
  ctx.page = p20;
  drawPageBackgroundAndBorder(ctx);
  y2 = drawHeaderRelatorio(ctx, 8);
  p20.drawText("Referências", { x: CONTENT_LEFT, y: y2, size: 16, font: fontB, color: tituloAzul });
  y2 -= 44;
  y2 = drawParagraph(p20, "• Teste de QI Profissional – Relatório gerado automaticamente.", CONTENT_LEFT, y2, {
    font: fontB,
    size: 12,
    color: textPrimary,
    maxWidth: contentWidth
  });
  y2 -= 16;
  y2 = drawParagraph(p20, "• Escalas de QI baseadas em normas psicométricas usuais (média 100, desvio padrão 15).", CONTENT_LEFT, y2, {
    font: fontB,
    size: 12,
    color: textPrimary,
    maxWidth: contentWidth
  });
  y2 -= 16;
  y2 = drawParagraph(p20, "• Este documento é confidencial e destinado ao candidato.", CONTENT_LEFT, y2, {
    font: fontB,
    size: 12,
    color: textPrimary,
    maxWidth: contentWidth
  });
  drawFooter(ctx, 20);

  // ——— PÁGINA 21: Certificado de verificação ———
  const p21 = pdfDoc.addPage([width, height]);
  ctx.page = p21;
  drawPageFrame(ctx);
  y2 = drawHeaderRelatorio(ctx, 8);
  p21.drawText("Certificado de verificação", { x: CONTENT_LEFT, y: y2, size: 16, font: fontB, color: tituloAzul });
  y2 -= 44;
  y2 = drawParagraph(p21, "Este relatório foi emitido electronicamente e pode ser verificado através do ID abaixo.", CONTENT_LEFT, y2, {
    font: fontB,
    size: 12,
    color: textPrimary,
    maxWidth: contentWidth
  });
  y2 -= 36;
  const certBoxH = 92;
  const certBoxTop = y2 - certBoxH;
  p21.drawRectangle({
    x: CONTENT_LEFT,
    y: certBoxTop,
    width: contentWidth,
    height: certBoxH,
    borderColor: borderAzul,
    borderWidth: 1.5,
    color: boxBg
  });
  const certInnerW = contentWidth - 40;
  let certY = y2 - 24;
  certY = drawParagraph(p21, `ID do certificado: ${params.certificadoId}`, CONTENT_LEFT + 20, certY, {
    font: fontB,
    size: 11,
    color: textPrimary,
    maxWidth: certInnerW
  });
  certY -= 18;
  p21.drawText(`Candidato: ${params.nome}`, { x: CONTENT_LEFT + 20, y: certY, size: 11, font: fontB, color: textPrimary });
  certY -= 18;
  p21.drawText(`Emitido em: ${params.dataEmissao}`, {
    x: CONTENT_LEFT + 20,
    y: certY,
    size: 11,
    font: fontB,
    color: textPrimary
  });
  p21.drawText("Assinatura digital verificada (simulação)", {
    x: CONTENT_LEFT,
    y: MARGIN + 52,
    size: 10,
    font: fontB,
    color: emerald
  });
  p21.drawText("Página 21 de 21", {
    x: width - CONTENT_LEFT - 70,
    y: MARGIN + 24,
    size: 9,
    font: fontB,
    color: tituloAzul
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
