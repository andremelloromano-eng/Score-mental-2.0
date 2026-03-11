import React from "react";
import {
  Document,
  type DocumentProps,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
  Rect,
  Line,
  Circle
} from "@react-pdf/renderer";

export type PremiumCertificateAreaId =
  | "percepcao_visual"
  | "pensamento_analitico"
  | "raciocinio_abstrato"
  | "orientacao_espacial"
  | "reconhecimento_padroes";

export type PremiumCertificateArea = {
  id: PremiumCertificateAreaId;
  nome: string;
  descricaoProfissional: string;
  questoes: number[];
};

export type PremiumCertificateQuestion = {
  id: number;
  pergunta: string;
  correctAnswer: "A" | "B" | "C" | "D";
};

export type PremiumCertificateProps = {
  nome: string;
  qiFinal: number;
  percentil: number;
  dataEmissao: string;
  relatorioId: string;
  totalPerguntas: number;
  acertos: number;
  respostas: Record<number, string>;
  perguntas: PremiumCertificateQuestion[];
};

const COLORS = {
  space: "#0B1220",
  spaceSoft: "#101A33",
  cobalt: "#2563EB",
  cobaltSoft: "#DBEAFE",
  silver: "#94A3B8",
  ink: "#0F172A",
  white: "#FFFFFF",
  slate: "#334155",
  border: "#E2E8F0",
  panel: "#F8FAFC"
} as const;

const AREA_BAR_COLORS: Record<PremiumCertificateAreaId, string> = {
  percepcao_visual: "#2563EB",
  raciocinio_abstrato: "#7C3AED",
  reconhecimento_padroes: "#0D9488",
  orientacao_espacial: "#F97316",
  pensamento_analitico: "#16A34A"
};

const AREAS: PremiumCertificateArea[] = [
  {
    id: "percepcao_visual",
    nome: "Percepção Visual",
    questoes: [1, 2, 3, 4, 5],
    descricaoProfissional:
      "Mede o quão bem você extrai informação útil de estímulos visuais (formas, contrastes, relações e detalhes). Essa competência é crítica em trabalhos onde pequenos sinais visuais mudam decisões: Design Gráfico (hierarquia e leitura de composição), Radiologia/Imagem (detecção de anomalias sutis) e Inspeção de Qualidade Industrial (identificação rápida de defeitos e variações fora do padrão)."
  },
  {
    id: "raciocinio_abstrato",
    nome: "Raciocínio Abstrato",
    questoes: [6, 7, 8, 9, 10],
    descricaoProfissional:
      "Avalia a capacidade de identificar padrões complexos e inferir regras sem informação prévia explícita. Na prática, isso aparece em Programação de Software (entender estruturas, dependências e refatorar sistemas), Matemática Avançada (generalizações, prova e abstração) e Planejamento Estratégico (criar modelos mentais para cenários novos e tomar decisões com sinais incompletos)."
  },
  {
    id: "reconhecimento_padroes",
    nome: "Reconhecimento de Padrões",
    questoes: [11, 12, 13, 14, 15],
    descricaoProfissional:
      "Mede a detecção de regras e recorrências em dados, com foco em identificar tendências e anomalias. É altamente aplicável em Análise de Mercado Financeiro (trader/quant: leitura de regimes e desvios), Cibersegurança (reconhecer padrões de ataque e comportamento suspeito) e Diagnóstico Médico (associar sintomas e sinais a hipóteses e distinguir o “normal” do “atípico”)."
  },
  {
    id: "orientacao_espacial",
    nome: "Orientação Espacial",
    questoes: [16, 17, 18, 19, 20],
    descricaoProfissional:
      "Reflete a manipulação mental de objetos e cenários 3D: rotacionar, projetar, antecipar encaixes e trajetórias. É uma base forte para Arquitetura e Engenharia Civil (visualizar estruturas e interferências), Pilotagem (orientação e navegação espacial) e Logística (otimização de espaço, rotas e distribuição física)."
  },
  {
    id: "pensamento_analitico",
    nome: "Pensamento Analítico",
    questoes: [21, 22, 23],
    descricaoProfissional:
      "Mede a habilidade de decompor problemas complexos em etapas lógicas e verificáveis. No mundo real, sustenta Gestão de Projetos (planejamento, riscos e dependências), Advocacia (construção de tese, análise de evidências e coerência argumentativa) e Consultoria de Negócios (diagnóstico, priorização de hipóteses e recomendações baseadas em dados)."
  }

];

function NeuralBrainIcon({ size = 220 }: { size?: number }) {
  const s = size;
  const blue = "#3498db";
  return (
    <Svg width={s} height={s} viewBox="0 0 220 220" preserveAspectRatio="xMidYMid meet">
      <Path
        d="M72 60c-14 3-25 16-25 32 0 8 2 14 7 20-10 6-16 16-16 29 0 20 14 35 34 35h24V60H72z"
        fill="none"
        stroke={blue}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M148 60c14 3 25 16 25 32 0 8-2 14-7 20 10 6 16 16 16 29 0 20-14 35-34 35h-24V60h24z"
        fill="none"
        stroke={blue}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M88 84c8-10 18-15 22-15s14 5 22 15"
        fill="none"
        stroke={blue}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Path
        d="M80 112c10-8 22-12 30-12s20 4 30 12"
        fill="none"
        stroke={blue}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Path
        d="M92 140c6-6 12-9 18-9s12 3 18 9"
        fill="none"
        stroke={blue}
        strokeWidth={5}
        strokeLinecap="round"
      />

      <Path
        d="M96 92 L78 78"
        fill="none"
        stroke={blue}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Path
        d="M124 92 L142 78"
        fill="none"
        stroke={blue}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Path
        d="M92 118 L70 118"
        fill="none"
        stroke={blue}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Path
        d="M128 118 L150 118"
        fill="none"
        stroke={blue}
        strokeWidth={4}
        strokeLinecap="round"
      />

      <Circle cx={78} cy={78} r={8} fill={COLORS.white} stroke={blue} strokeWidth={4} />
      <Circle cx={142} cy={78} r={8} fill={COLORS.white} stroke={blue} strokeWidth={4} />
      <Circle cx={70} cy={118} r={8} fill={COLORS.white} stroke={blue} strokeWidth={4} />
      <Circle cx={150} cy={118} r={8} fill={COLORS.white} stroke={blue} strokeWidth={4} />
      <Circle cx={110} cy={60} r={6} fill={blue} />
      <Circle cx={110} cy={162} r={6} fill={blue} />
    </Svg>
  );
}


function QrPlaceholder({ size = 78 }: { size?: number }) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} preserveAspectRatio="xMidYMid meet">
      <Rect x={0} y={0} width={s} height={s} fill={COLORS.panel} stroke={COLORS.border} strokeWidth={1} />
      <Rect x={8} y={8} width={18} height={18} fill={COLORS.ink} />
      <Rect x={s - 26} y={8} width={18} height={18} fill={COLORS.ink} />
      <Rect x={8} y={s - 26} width={18} height={18} fill={COLORS.ink} />
      <Rect x={34} y={34} width={8} height={8} fill={COLORS.ink} />
      <Rect x={46} y={34} width={6} height={6} fill={COLORS.ink} />
      <Rect x={34} y={46} width={6} height={6} fill={COLORS.ink} />
      <Rect x={52} y={50} width={10} height={6} fill={COLORS.ink} />
      <Rect x={28} y={56} width={8} height={6} fill={COLORS.ink} />
      <Rect x={44} y={58} width={6} height={10} fill={COLORS.ink} />
    </Svg>
  );
}

function MedalSeal({ size = 108 }: { size?: number }) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const outerR = s * 0.48;
  const innerR = s * 0.39;
  const ringR = s * 0.34;
  const teeth = 28;
  const gold = "#D4AF37";

  const scallopPath = Array.from({ length: teeth }, (_, i) => {
    const t = (i / teeth) * Math.PI * 2;
    const r = i % 2 === 0 ? outerR : outerR * 0.92;
    const x = cx + Math.cos(t) * r;
    const y = cy + Math.sin(t) * r;
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");

  const checkPath = `M ${(cx - s * 0.12).toFixed(2)} ${(cy + s * 0.01).toFixed(2)}
    L ${(cx - s * 0.03).toFixed(2)} ${(cy + s * 0.10).toFixed(2)}
    L ${(cx + s * 0.14).toFixed(2)} ${(cy - s * 0.10).toFixed(2)}`;

  return (
    <View style={{ width: s, height: s, opacity: 0.9, position: "relative" }}>
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} preserveAspectRatio="xMidYMid meet">
        <Path d={`${scallopPath} Z`} fill="#FFF7ED" stroke={gold} strokeWidth={1.2} />
        <Path
          d={`M ${cx + innerR} ${cy} A ${innerR} ${innerR} 0 1 0 ${cx - innerR} ${cy} A ${innerR} ${innerR} 0 1 0 ${
            cx + innerR
          } ${cy}`}
          stroke={gold}
          strokeWidth={0.9}
          fill="none"
        />
        <Path
          d={`M ${cx + ringR} ${cy} A ${ringR} ${ringR} 0 1 0 ${cx - ringR} ${cy} A ${ringR} ${ringR} 0 1 0 ${cx + ringR} ${cy}`}
          stroke={gold}
          strokeWidth={0.6}
          fill="none"
        />
        <Path d={checkPath} stroke={COLORS.ink} strokeWidth={2.2} fill="none" />
      </Svg>

      <Text
        style={{
          position: "absolute",
          top: 14,
          left: 0,
          right: 0,
          fontSize: 6,
          letterSpacing: 0.35,
          lineHeight: 1.0,
          textAlign: "center",
          color: COLORS.slate
        }}
        wrap={false}
      >
        CERTIFIED IQ TEST
      </Text>
      <Text
        style={{
          position: "absolute",
          bottom: 14,
          left: 0,
          right: 0,
          fontSize: 6,
          letterSpacing: 0.35,
          lineHeight: 1.0,
          textAlign: "center",
          color: COLORS.slate
        }}
        wrap={false}
      >
        • 2026 •
      </Text>
    </View>
  );
}


const AREA_APPLICATIONS: Record<PremiumCertificateAreaId, string[]> = {
  percepcao_visual: [
    "interpretação de imagens e variações sutis (ex.: laudos, inspeção)",
    "validação visual por checklist (padrões, contrastes, alinhamento)",
    "treino de velocidade com precisão (reduzir falsos positivos/negativos)"
  ],
  raciocinio_abstrato: [
    "modelagem de regras a partir de poucos exemplos (abstração)",
    "programação: leitura de código, padrões e refatoração", 
    "planejamento: cenários e hipóteses com informação incompleta"
  ],
  reconhecimento_padroes: [
    "análise de séries e anomalias (dados/mercado)",
    "segurança: reconhecer assinaturas e comportamentos suspeitos",
    "diagnóstico: associar sinais a hipóteses e excluir padrões comuns"
  ],
  orientacao_espacial: [
    "visualização 3D e rotação mental (projetos/obra)",
    "planejamento de rotas, espaço e fluxo (logística)",
    "checagem de interferências e restrições (segurança/execução)"
  ],
  pensamento_analitico: [
    "quebrar problemas em etapas com critérios de validação",
    "análise de riscos, dependências e trade-offs (projetos)",
    "argumentação estruturada e tomada de decisão baseada em evidências"
  ]
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.white,
    padding: 40
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16
  },
  headerLeft: {
    flexDirection: "column",
    paddingTop: 14
  },
  kicker: {
    fontSize: 9,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: COLORS.slate
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.ink,
    marginTop: 6
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.slate,
    marginTop: 4,
    maxWidth: 420,
    lineHeight: 1.4
  },
  badge: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.panel,
    width: 188,
    alignItems: "center"
  },
  badgeLabel: {
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: COLORS.slate,
    textAlign: "center"
  },
  badgeValue: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.ink,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 1.15,
    maxWidth: "100%"
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 18,
    backgroundColor: COLORS.panel
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.ink,
    marginBottom: 10
  },
  bigName: {
    fontSize: 42,
    fontWeight: 700,
    color: COLORS.ink,
    textAlign: "center",
    marginTop: 50
  },
  coverLayout: {
    flex: 1,
    justifyContent: "space-between"
  },
  coverIconWrap: {
    marginTop: 46,
    alignItems: "center"
  },
  coverBottom: {
    marginBottom: 10,
    alignItems: "center"
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: COLORS.ink,
    textAlign: "center"
  },
  coverName: {
    fontSize: 34,
    fontWeight: 700,
    color: COLORS.ink,
    textAlign: "center",
    marginTop: 10
  },
  coverInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 34,
    paddingHorizontal: 6
  },
  coverInfoBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.white
  },
  coverInfoLabel: {
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: COLORS.slate,
    textAlign: "center"
  },
  coverInfoValue: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.ink,
    marginTop: 6,
    textAlign: "center"
  },
  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  footerColLeft: {
    flex: 1.6,
    paddingRight: 8
  },
  footerColCenter: {
    flex: 1,
    paddingHorizontal: 8
  },
  footerColRight: {
    flex: 0.9,
    paddingLeft: 8
  },
  footerRight: {
    fontSize: 8,
    color: COLORS.slate,
    textAlign: "right",
    maxWidth: 180
  },
  footerText: {
    fontSize: 9,
    letterSpacing: 2.0,
    textTransform: "uppercase",
    color: COLORS.slate
  },
  footerPage: {
    fontSize: 9,
    color: COLORS.slate,
    textAlign: "center"
  },
  dashboardRow: {
    flexDirection: "column",
    gap: 14
  },
  metricGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14
  },
  metricTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 14
  },
  metricTileLabel: {
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: COLORS.slate
  },
  metricTileValue: {
    fontSize: 24,
    fontWeight: 700,
    color: COLORS.ink,
    marginTop: 6
  },
  metricTileHint: {
    fontSize: 10,
    color: COLORS.slate,
    marginTop: 6,
    lineHeight: 1.35
  },
  paragraph: {
    fontSize: 11,
    color: COLORS.slate,
    lineHeight: 1.55
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.ink,
    marginTop: 8,
    marginBottom: 12
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    overflow: "hidden",
    width: "100%"
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.cobaltSoft,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 10
  },
  tableHeaderCell: {
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: COLORS.space,
    fontWeight: 700
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingVertical: 8
  },
  tableCell: {
    fontSize: 10,
    color: COLORS.ink
  },
  barsTable: {
    width: "100%",
    flexDirection: "column",
    marginTop: 6
  },
  barsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15
  },
  barsLabel: {
    width: 150,
    fontSize: 10,
    color: COLORS.slate
  },
  barsBarBg: {
    flex: 1,
    height: 16,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden"
  },
  barsBarFill: {
    height: 16,
    borderRadius: 4
  },
  barsPct: {
    width: 62,
    paddingLeft: 10,
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  barsPctPill: {
    fontSize: 9,
    color: COLORS.ink,
    fontWeight: 700,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8
  },
  barsScale: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 150,
    paddingRight: 62
  },
  barsScaleText: {
    fontSize: 9,
    color: COLORS.slate
  },
  statusOk: {
    color: "#16A34A",
    fontWeight: 700
  },
  statusBad: {
    color: "#DC2626",
    fontWeight: 700
  },
  certificateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18
  },
  certificateKicker: {
    fontSize: 9,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: COLORS.slate
  },
  certificateTitleSmall: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.ink,
    marginTop: 4
  },
  certificateStar: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: COLORS.space,
    alignItems: "center",
    justifyContent: "center"
  },
  certificateStarText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: 700
  },
  certificateMainTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: COLORS.ink,
    textAlign: "center",
    marginTop: 8
  },
  certificateSubTitle: {
    fontSize: 9,
    color: COLORS.slate,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 1.35
  },
  certificateCenterStack: {
    marginTop: 18,
    flexDirection: "column",
    alignItems: "center"
  },
  certificateName: {
    fontSize: 26,
    fontWeight: 700,
    color: COLORS.ink,
    textAlign: "center",
    marginTop: 14
  },
  certificateBody: {
    fontSize: 10,
    color: COLORS.slate,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 1.45,
    paddingHorizontal: 40
  },
  certificateSealWrap: {
    marginTop: 0,
    flexDirection: "row",
    justifyContent: "center"
  },
  certificateSeal: {
    marginLeft: 0
  },
  certificateGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18
  },
  certificateField: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 0
  },
  certificateFieldLabel: {
    fontSize: 8,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: COLORS.slate
  },
  certificateFieldValue: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.ink,
    marginTop: 6
  },
  certificateBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 22,
    alignItems: "flex-end"
  },
  certificateAuthBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 0
  },
  certificateAuthValue: {
    fontSize: 8,
    color: COLORS.slate,
    marginTop: 6
  },
  certificateAuthHint: {
    fontSize: 7,
    color: COLORS.slate,
    marginTop: 4,
    lineHeight: 1.35
  },
  certificateQrBox: {
    width: 96,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    padding: 6
  },
  certificateQrLabel: {
    fontSize: 7,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: COLORS.slate
  }
});

function clampPercentile(p: number): number {
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(99, Math.round(p)));
}

function normalizeAnswer(answer?: string | null): "a" | "b" | "c" | "d" | null {
  if (!answer) return null;
  const a = String(answer).trim().toLowerCase();
  if (a === "a" || a === "b" || a === "c" || a === "d") return a;
  return null;
}

function correctAnswerToOptionId(answer: PremiumCertificateQuestion["correctAnswer"]): "a" | "b" | "c" | "d" {
  return answer.toLowerCase() as "a" | "b" | "c" | "d";
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function areaScoreFromQuestions(props: PremiumCertificateProps): Record<PremiumCertificateAreaId, { acertos: number; total: number }> {
  const set = new Map<number, PremiumCertificateQuestion>();
  for (const p of props.perguntas) set.set(p.id, p);

  const scores: Record<PremiumCertificateAreaId, { acertos: number; total: number }> = {
    percepcao_visual: { acertos: 0, total: 0 },
    pensamento_analitico: { acertos: 0, total: 0 },
    raciocinio_abstrato: { acertos: 0, total: 0 },
    orientacao_espacial: { acertos: 0, total: 0 },
    reconhecimento_padroes: { acertos: 0, total: 0 }
  };

  for (const area of AREAS) {
    for (const qid of area.questoes) {
      const q = set.get(qid);
      if (!q) continue;
      scores[area.id].total += 1;
      const marcado = normalizeAnswer(props.respostas[qid]);
      if (!marcado) continue;
      const correta = correctAnswerToOptionId(q.correctAnswer);
      if (marcado === correta) scores[area.id].acertos += 1;
    }
  }
  return scores;
}

function FooterBlock({
  pageNumber,
  totalPages,
  relatorioId
}: {
  pageNumber: number;
  totalPages: number;
  relatorioId: string;
}) {
  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerColLeft}>
        <Text style={styles.footerText} wrap={false}>
          RELATÓRIO CONFIDENCIAL
        </Text>
      </View>
      <View style={styles.footerColCenter}>
        <Text style={styles.footerPage} wrap={false}>
          Página {pageNumber} de {totalPages}
        </Text>
      </View>
      <View style={styles.footerColRight}>
        <Text style={styles.footerRight} wrap={false}>
          ID {relatorioId}
        </Text>
      </View>
    </View>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 22,
        padding: 26,
        backgroundColor: COLORS.white,
        position: "relative",
        flex: 1
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          top: 14,
          bottom: 14,
          borderWidth: 1,
          borderColor: "#CBD5E1",
          borderRadius: 18
        }}
      />
      <View style={{ position: "relative", flex: 1 }}>{children}</View>
    </View>
  );
}

function HeaderBlock({ nome, dataEmissao }: { nome: string; dataEmissao: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.kicker}>Relatório Premium</Text>
        <Text style={styles.title}>Teste de QI Profissional</Text>
        <Text style={styles.subtitle}>
          Documento técnico confidencial. As análises são calculadas com base no desempenho real em 23 questões e no gabarito
          oficial do teste.
        </Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeLabel}>Emissão</Text>
        <Text style={styles.badgeValue}>{dataEmissao}</Text>
      </View>
    </View>
  );
}

function BarsDashboard({ scores }: { scores: Array<{ label: string; pct: number; value: string }> }) {
  const labelToAreaId: Record<string, PremiumCertificateAreaId> = {
    "Percepção Visual": "percepcao_visual",
    "Raciocínio Abstrato": "raciocinio_abstrato",
    "Reconhecimento de Padrões": "reconhecimento_padroes",
    "Orientação Espacial": "orientacao_espacial",
    "Pensamento Analítico": "pensamento_analitico"
  };

  return (
    <View style={styles.barsTable}>
      {scores.map((s) => (
        <View key={s.label} style={styles.barsRow}>
          <Text style={styles.barsLabel} wrap={false}>
            {s.label}
          </Text>
          <View style={styles.barsBarBg}>
            <View
              style={[
                styles.barsBarFill,
                {
                  width: `${clamp(s.pct, 0, 100)}%`,
                  backgroundColor: AREA_BAR_COLORS[labelToAreaId[s.label] ?? "percepcao_visual"]
                }
              ]}
            />
          </View>
          <View style={styles.barsPct}>
            <Text style={styles.barsPctPill} wrap={false}>
              {clamp(s.pct, 0, 100)}%
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.barsScale}>
        <Text style={styles.barsScaleText} wrap={false}>
          0
        </Text>
        <Text style={styles.barsScaleText} wrap={false}>
          25
        </Text>
        <Text style={styles.barsScaleText} wrap={false}>
          50
        </Text>
        <Text style={styles.barsScaleText} wrap={false}>
          75
        </Text>
        <Text style={styles.barsScaleText} wrap={false}>
          100
        </Text>
      </View>
    </View>
  );
}

function GaussChart({ qiFinal }: { qiFinal: number }) {
  const w = 520;
  const h = 160;
  const paddingX = 40;
  const paddingY = 24;
  const minQi = 55;
  const maxQi = 145;
  const mu = 100;
  const sigma = 15;

  const xs: Array<[number, number]> = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const xQi = minQi + (maxQi - minQi) * t;
    const z = (xQi - mu) / sigma;
    const y = Math.exp(-0.5 * z * z);
    xs.push([xQi, y]);
  }
  const maxY = Math.max(...xs.map(([, y]) => y));

  const toX = (qi: number) => paddingX + ((qi - minQi) / (maxQi - minQi)) * (w - paddingX * 2);
  const toY = (y: number) => h - paddingY - (y / maxY) * (h - paddingY * 2);

  const path = xs
    .map(([qi, y], idx) => {
      const x = toX(qi);
      const yy = toY(y);
      return `${idx === 0 ? "M" : "L"}${x.toFixed(2)} ${yy.toFixed(2)}`;
    })
    .join(" ");

  const markerX = toX(clamp(qiFinal, minQi, maxQi));

  return (
    <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <Rect x={0} y={0} width={w} height={h} fill={COLORS.white} />
      <Path d={path} stroke={COLORS.cobalt} strokeWidth={3} fill="none" />
      <Line x1={markerX} y1={paddingY} x2={markerX} y2={h - paddingY} stroke="#0F172A" strokeWidth={2} />
    </Svg>
  );
}

export function createPremiumCertificateDocument(
  props: PremiumCertificateProps
): React.ReactElement<DocumentProps> {
  const percentil = clampPercentile(props.percentil);
  const totalPages = 12;

  const areaScores = areaScoreFromQuestions(props);
  const dashboardOrder: PremiumCertificateAreaId[] = [
    "percepcao_visual",
    "pensamento_analitico",
    "raciocinio_abstrato",
    "orientacao_espacial",
    "reconhecimento_padroes"
  ];

  const dashboardScores = dashboardOrder.map((id) => {
    const area = AREAS.find((a) => a.id === id);
    const s = areaScores[id];
    const pct = s.total > 0 ? Math.round((s.acertos / s.total) * 100) : 0;
    return {
      label: area?.nome ?? id,
      pct,
      value: `${s.acertos}/${s.total}`
    };
  });

  const strengths = dashboardScores
    .slice()
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 2)
    .map((s) => s.label);

  const careerSuggestions: Record<string, string[]> = {
    "Percepção Visual": ["Product Designer", "QA / Auditoria", "Analista de UX", "Consultor de BI"],
    "Pensamento Analítico": ["Analista de Dados", "Consultor", "Engenheiro de Software", "Analista de Risco"],
    "Raciocínio Abstrato": ["Estratégia", "Product Manager", "Engenharia", "Pesquisa/Analytics"],
    "Orientação Espacial": ["Engenharia", "Arquitetura", "Logística", "Planejamento"],
    "Reconhecimento de Padrões": ["Data Science", "Fraude/Compliance", "Cibersegurança", "Operações"],
    "": ["Analista", "Consultor", "Gestão", "Tecnologia"]
  };

  const suggestedJobs = Array.from(
    new Set(
      strengths
        .flatMap((s) => careerSuggestions[s] ?? careerSuggestions[""])
        .slice(0, 8)
    )
  );

  const questionsById = new Map<number, PremiumCertificateQuestion>();
  for (const q of props.perguntas) questionsById.set(q.id, q);

  const tableRows = Array.from({ length: props.totalPerguntas }, (_, i) => i + 1)
    .map((id) => {
      const q = questionsById.get(id);
      if (!q) return null;
      const marcado = normalizeAnswer(props.respostas[id]);
      const correta = correctAnswerToOptionId(q.correctAnswer);
      const ok = marcado != null && marcado === correta;
      return {
        id,
        marcado: marcado ? marcado.toUpperCase() : "—",
        correta: correta.toUpperCase(),
        status: ok ? "OK" : "ERRO"
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Frame>
          <HeaderBlock nome={props.nome} dataEmissao={props.dataEmissao} />
          <Text style={styles.bigName}>{props.nome}</Text>
          <View style={styles.coverInfoRow}>
            <View style={styles.coverInfoBox}>
              <Text style={styles.coverInfoLabel}>QI Final</Text>
              <Text style={styles.coverInfoValue}>{props.qiFinal}</Text>
            </View>
            <View style={styles.coverInfoBox}>
              <Text style={styles.coverInfoLabel}>Percentil</Text>
              <Text style={styles.coverInfoValue}>{percentil}º</Text>
            </View>
            <View style={styles.coverInfoBox}>
              <Text style={styles.coverInfoLabel}>Pontuação</Text>
              <Text style={styles.coverInfoValue}>
                {props.acertos}/{props.totalPerguntas}
              </Text>
            </View>
          </View>
        </Frame>
        <FooterBlock pageNumber={1} totalPages={totalPages} relatorioId={props.relatorioId} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Frame>
          <HeaderBlock nome={props.nome} dataEmissao={props.dataEmissao} />

          <View style={{ flexDirection: "column", gap: 14 }} wrap={false}>
            <Text style={styles.sectionTitle}>Dashboard de Resultados</Text>

            <View style={styles.metricGrid}>
              <View style={styles.metricTile}>
                <Text style={styles.metricTileLabel}>QI Final</Text>
                <Text style={styles.metricTileValue}>{props.qiFinal}</Text>
                <Text style={styles.metricTileHint}>
                  Calculado sobre {props.totalPerguntas} questões. 100% = {props.totalPerguntas} acertos.
                </Text>
              </View>
              <View style={styles.metricTile}>
                <Text style={styles.metricTileLabel}>Percentil</Text>
                <Text style={styles.metricTileValue}>{percentil}º</Text>
                <Text style={styles.metricTileHint}>Posicionamento aproximado em relação à população (referência N(100,15)).</Text>
              </View>
              <View style={styles.metricTile}>
                <Text style={styles.metricTileLabel}>Precisão</Text>
                <Text style={styles.metricTileValue}>{Math.round((props.acertos / Math.max(props.totalPerguntas, 1)) * 100)}%</Text>
                <Text style={styles.metricTileHint}>Taxa de acerto total no conjunto atual de 23 questões.</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: "column", gap: 14, marginTop: 14 }}>
            <View style={[styles.card, { padding: 16, width: "100%" }]} wrap={false}>
              <Text style={styles.cardTitle}>Distribuição por área (barras)</Text>
              <BarsDashboard scores={dashboardScores} />
            </View>
            <View style={[styles.card, { width: "100%" }]}>
              <Text style={styles.cardTitle}>Insights rápidos</Text>
              <Text style={styles.paragraph}>
                Pontos fortes detectados: {strengths.length > 0 ? strengths.join(" e ") : "—"}. Use isso como foco para funções que
                exigem consistência cognitiva e tomada de decisão orientada a padrões.
              </Text>
            </View>
          </View>
        </Frame>
        <FooterBlock pageNumber={2} totalPages={totalPages} relatorioId={props.relatorioId} />
      </Page>

      {AREAS.map((area, idx) => {
        const pageNumber = 3 + idx;
        const s = areaScores[area.id];
        const pct = s.total > 0 ? Math.round((s.acertos / s.total) * 100) : 0;
        const interpretation =
          pct >= 80
            ? "Excelente desempenho. Você tende a identificar padrões com muita consistência e operar bem sob pressão analítica."
            : pct >= 60
              ? "Bom desempenho. Você demonstra base sólida e tende a evoluir rápido com prática direcionada."
              : pct >= 40
                ? "Desempenho moderado. Com métodos e checklists, você pode aumentar previsibilidade e reduzir erros."
                : "Atenção. Esse resultado sugere que decisões rápidas nessa competência podem exigir validações extras.";

        return (
          <Page key={area.id} size="A4" style={styles.page}>
            <Frame>
              <HeaderBlock nome={props.nome} dataEmissao={props.dataEmissao} />
              <Text style={styles.sectionTitle}>Análise Detalhada — {area.nome}</Text>
              <View style={styles.metricGrid}>
                <View style={[styles.metricTile, { flex: 1.2 }]}>
                  <Text style={styles.metricTileLabel}>Score da área</Text>
                  <Text style={styles.metricTileValue}>
                    {s.acertos}/{s.total} ({pct}%)
                  </Text>
                  <Text style={styles.metricTileHint}>{interpretation}</Text>
                </View>
                <View style={[styles.metricTile, { flex: 1 }]}>
                  <Text style={styles.metricTileLabel}>Questões usadas</Text>
                  <Text style={styles.metricTileValue}>{area.questoes.join(", ")}</Text>
                  <Text style={styles.metricTileHint}>Este relatório usa o conjunto atual de 23 questões (rastreável por ID).</Text>
                </View>
              </View>

              <View style={{ marginTop: 18 }}>
                <Text style={styles.paragraph}>{area.descricaoProfissional}</Text>
              </View>

              <View style={{ marginTop: 16 }}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Aplicações práticas (cenário profissional)</Text>
                  <Text style={styles.paragraph}>Para maximizar performance nessa competência, priorize:</Text>
                  <View style={{ marginTop: 8 }}>
                    {(AREA_APPLICATIONS[area.id] ?? []).map((item) => (
                      <Text key={item} style={styles.paragraph}>
                        - {item}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            </Frame>
            <FooterBlock pageNumber={pageNumber} totalPages={totalPages} relatorioId={props.relatorioId} />
          </Page>
        );
      })}

      <Page size="A4" style={styles.page}>
        <Frame>
          <HeaderBlock nome={props.nome} dataEmissao={props.dataEmissao} />
          <Text style={styles.sectionTitle}>Detalhamento Técnico — 23 Questões</Text>
          <Text style={[styles.paragraph, { marginBottom: 14 }]}>
            A tabela abaixo garante consistência 100% entre sua marcação e o gabarito oficial (campo correctAnswer do dataset atual).
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={{ flexBasis: "18%", paddingLeft: 14 }}>
                <Text style={styles.tableHeaderCell}>Questão</Text>
              </View>
              <View style={{ flexBasis: "22%" }}>
                <Text style={styles.tableHeaderCell}>Marcada</Text>
              </View>
              <View style={{ flexBasis: "22%" }}>
                <Text style={styles.tableHeaderCell}>Gabarito</Text>
              </View>
              <View style={{ flexBasis: "38%" }}>
                <Text style={styles.tableHeaderCell}>Status</Text>
              </View>
            </View>

            {tableRows.map((row, idx) => (
              <View key={row.id} style={[styles.tableRow, idx === tableRows.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                <View style={{ flexBasis: "18%", paddingLeft: 14 }}>
                  <Text style={styles.tableCell}>#{row.id}</Text>
                </View>
                <View style={{ flexBasis: "22%" }}>
                  <Text style={styles.tableCell}>{row.marcado}</Text>
                </View>
                <View style={{ flexBasis: "22%" }}>
                  <Text style={styles.tableCell}>{row.correta}</Text>
                </View>
                <View style={{ flexBasis: "38%" }}>
                  <Text style={[styles.tableCell, row.status === "OK" ? styles.statusOk : styles.statusBad]}>{row.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </Frame>
        <FooterBlock pageNumber={3 + AREAS.length} totalPages={totalPages} relatorioId={props.relatorioId} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Frame>
          <HeaderBlock nome={props.nome} dataEmissao={props.dataEmissao} />
          <Text style={styles.sectionTitle}>Comparação Populacional</Text>
          <Text style={[styles.paragraph, { marginBottom: 14 }]}>
            O gráfico abaixo representa uma curva de Gauss de referência (média 100, desvio 15). Seu marcador indica a posição
            aproximada do QI final.
          </Text>
          <View style={[styles.card, { padding: 16, width: "100%" }]} wrap={false}>
            <GaussChart qiFinal={props.qiFinal} />
            <View style={{ marginTop: 10, flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 9, color: COLORS.slate }} wrap={false}>
                55
              </Text>
              <Text style={{ fontSize: 9, color: COLORS.slate }} wrap={false}>
                100
              </Text>
              <Text style={{ fontSize: 9, color: COLORS.slate }} wrap={false}>
                145
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <Text style={styles.paragraph}>
              A linha vertical representa sua posição ("Você"). Seu percentil estimado é {percentil}º. Valores são aproximados e
              servem como referência comparativa.
            </Text>
          </View>
        </Frame>
        <FooterBlock pageNumber={4 + AREAS.length} totalPages={totalPages} relatorioId={props.relatorioId} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Frame>
          <HeaderBlock nome={props.nome} dataEmissao={props.dataEmissao} />
          <Text style={styles.sectionTitle}>Guia de Carreira (baseado em pontos fortes)</Text>
          <Text style={[styles.paragraph, { marginBottom: 12 }]}>
            O objetivo é orientar escolhas profissionais com base nas competências mais consistentes identificadas no seu teste.
          </Text>
          <View style={styles.metricGrid}>
            <View style={[styles.metricTile, { flex: 1.2 }]}>
              <Text style={styles.metricTileLabel}>Pontos fortes</Text>
              <Text style={styles.metricTileValue}>{strengths.length > 0 ? strengths.join(" + ") : "—"}</Text>
              <Text style={styles.metricTileHint}>Interprete como áreas onde você tende a ter maior previsibilidade de performance.</Text>
            </View>
            <View style={[styles.metricTile, { flex: 1 }]}>
              <Text style={styles.metricTileLabel}>Sugestões</Text>
              <Text style={[styles.metricTileValue, { fontSize: 14 }]}> 
                {suggestedJobs.slice(0, 6).join("\n")}
              </Text>
              <Text style={styles.metricTileHint}>Use como ponto de partida (não substitui aconselhamento profissional).</Text>
            </View>
          </View>
          <View style={{ marginTop: 14 }}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Próximos passos recomendados</Text>
              <Text style={styles.paragraph}>
                {"\n"}- escolha 1 competência para fortalecer por 14 dias
                {"\n"}- pratique com exercícios similares às áreas de menor percentil
                {"\n"}- valide decisões importantes com revisão por pares
              </Text>
            </View>
          </View>
        </Frame>
        <FooterBlock pageNumber={5 + AREAS.length} totalPages={totalPages} relatorioId={props.relatorioId} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Frame>
          <HeaderBlock nome={props.nome} dataEmissao={props.dataEmissao} />
          <Text style={styles.sectionTitle}>Resumo e Autenticação</Text>
          <View style={{ flexDirection: "column", gap: 14 }}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Resumo executivo</Text>
              <Text style={styles.paragraph}>
                QI Final: {props.qiFinal}. Percentil: {percentil}º. Pontuação: {props.acertos}/{props.totalPerguntas}. Este relatório é
                confidencial e foi gerado automaticamente a partir do dataset atual do teste.
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Como validar este documento</Text>
              <Text style={styles.paragraph}>
                Use o ID do relatório no rodapé para rastrear a versão e garantir consistência entre gabarito, marcações e cálculo. A
                próxima página contém o Certificado Premium (apresentação final para compartilhamento).
              </Text>
            </View>
          </View>
        </Frame>
        <FooterBlock pageNumber={6 + AREAS.length} totalPages={totalPages} relatorioId={props.relatorioId} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Frame>
          <View style={styles.certificateHeaderRow}>
            <View style={{ flexDirection: "column" }}>
              <Text style={styles.certificateKicker}>CERTIFICADO PREMIUM</Text>
              <Text style={styles.certificateTitleSmall}>Teste de QI Profissional</Text>
            </View>
            <View style={styles.certificateStar}>
              <Text style={styles.certificateStarText} wrap={false}>
                ★
              </Text>
            </View>
          </View>

          <Text style={styles.certificateMainTitle}>Certificado de Conclusão</Text>
          <Text style={styles.certificateSubTitle}>
            Documento oficial de desempenho cognitivo — validação por ID e autenticação digital.
          </Text>

          <View style={styles.certificateCenterStack}>
            <View style={styles.certificateSealWrap}>
              <View style={styles.certificateSeal}>
                <MedalSeal size={108} />
              </View>
            </View>

            <Text style={styles.certificateName}>{props.nome}</Text>
            <Text style={styles.certificateBody}>
              Este certificado confirma a conclusão do Teste de QI Profissional, com análise baseada em {props.totalPerguntas} questões.
              O resultado abaixo reflete a pontuação final apurada com rigor estatístico.
            </Text>
          </View>

          <View style={styles.certificateGrid}>
            <View style={styles.certificateField}>
              <Text style={styles.certificateFieldLabel}>QI final</Text>
              <Text style={styles.certificateFieldValue}>{props.qiFinal}</Text>
            </View>
            <View style={styles.certificateField}>
              <Text style={styles.certificateFieldLabel}>Percentil</Text>
              <Text style={styles.certificateFieldValue}>{percentil}º</Text>
            </View>
            <View style={styles.certificateField}>
              <Text style={styles.certificateFieldLabel}>Data de emissão</Text>
              <Text style={styles.certificateFieldValue}>{props.dataEmissao}</Text>
            </View>
          </View>

          <View style={styles.certificateBottomRow}>
            <View style={styles.certificateAuthBox}>
              <Text style={styles.certificateFieldLabel}>ID de autenticação</Text>
              <Text style={styles.certificateAuthValue} wrap={false}>
                {props.relatorioId}
              </Text>
              <Text style={styles.certificateAuthHint}>
                Para validação, utilize o ID acima ou a autenticação via QR Code ao lado. Este documento é exclusivo e rastreável.
              </Text>
            </View>
            <View style={styles.certificateQrBox}>
              <Text style={styles.certificateQrLabel} wrap={false}>
                QR / AUTH
              </Text>
              <View style={{ marginTop: 12, alignItems: "center" }}>
                <QrPlaceholder size={72} />
              </View>
            </View>
          </View>
        </Frame>
        <FooterBlock pageNumber={7 + AREAS.length} totalPages={totalPages} relatorioId={props.relatorioId} />
      </Page>
    </Document>
  );
}

export function PremiumCertificate(props: PremiumCertificateProps) {
  return createPremiumCertificateDocument(props);
}
