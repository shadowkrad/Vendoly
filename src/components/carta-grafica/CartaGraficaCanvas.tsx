"use client";

import React from "react";
import {
  CartaGraficaConfig,
  DatiAttivitaCarta,
  OrarioGiornoCarta,
  inizialiBrand,
  paletteLato,
} from "@/lib/carta-grafica-types";

export function StellinaSvg({
  color,
  size = 12,
  className = "",
}: {
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 1C12.7 7.8 16.2 11.3 23 12C16.2 12.7 12.7 16.2 12 23C11.3 16.2 7.8 12.7 1 12C7.8 11.3 11.3 7.8 12 1Z"
        fill={color}
      />
    </svg>
  );
}

/** Stellina a 4 punte posizionata in coordinate SVG (cx, cy, r) */
function SvgStar({ cx, cy, r = 8, fill }: { cx: number; cy: number; r?: number; fill: string }) {
  const k = r * 0.22;
  const d = [
    `M ${cx} ${cy - r}`,
    `C ${cx + k} ${cy - k}, ${cx + k} ${cy - k}, ${cx + r} ${cy}`,
    `C ${cx + k} ${cy + k}, ${cx + k} ${cy + k}, ${cx} ${cy + r}`,
    `C ${cx - k} ${cy + k}, ${cx - k} ${cy + k}, ${cx - r} ${cy}`,
    `C ${cx - k} ${cy - k}, ${cx - k} ${cy - k}, ${cx} ${cy - r}`,
    "Z",
  ].join(" ");
  return <path d={d} fill={fill} />;
}

/** Ramo d'ulivo botanico in coordinate SVG (180x180 base) */
function SvgOliveBranch({
  x,
  y,
  scale = 1,
  flipX = false,
  flipY = false,
  leafFill,
  strokeColor,
}: {
  x: number;
  y: number;
  scale?: number;
  flipX?: boolean;
  flipY?: boolean;
  leafFill: string;
  strokeColor: string;
}) {
  const sx = (flipX ? -1 : 1) * scale;
  const sy = (flipY ? -1 : 1) * scale;
  return (
    <g transform={`translate(${x}, ${y}) scale(${sx}, ${sy})`} opacity="0.92">
      <path
        d="M175 180 C150 140, 125 95, 95 45"
        stroke={strokeColor}
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M150 180 C145 148, 152 115, 168 78"
        stroke={strokeColor}
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M102 52 C84 36, 78 18, 92 14 C106 24, 110 40, 102 52 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <path
        d="M112 75 C86 68, 70 55, 65 40 C85 42, 104 56, 112 75 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <path
        d="M116 72 C122 50, 136 35, 152 30 C146 50, 132 66, 116 72 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <path
        d="M128 104 C98 98, 82 85, 74 68 C96 72, 116 86, 128 104 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <path
        d="M132 100 C138 78, 154 62, 170 56 C164 78, 148 94, 132 100 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <path
        d="M144 136 C114 130, 96 118, 88 102 C110 104, 130 118, 144 136 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <path
        d="M158 118 C162 96, 170 82, 178 72 C178 92, 170 108, 158 118 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <path
        d="M156 164 C126 160, 106 150, 96 136 C118 136, 140 148, 156 164 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
    </g>
  );
}

/** Ornamenti SVG su canvas di larghezza W e altezza H */
function SvgOrnamentiPreset({
  config,
  lato,
  w,
  h,
}: {
  config: CartaGraficaConfig;
  lato: "fronte" | "retro";
  w: number;
  h: number;
}) {
  const pal = paletteLato(config, lato);

  if (config.preset === "SFONDO_LIBERO") return null;

  if (config.preset === "BOTANICO_LUXURY") {
    const s = h / 380;
    return lato === "fronte" ? (
      <SvgOliveBranch
        x={w - 180 * s}
        y={h - 180 * s}
        scale={s}
        leafFill={pal.leafFill}
        strokeColor={pal.accent}
      />
    ) : (
      <>
        <SvgOliveBranch
          x={w - 180 * s}
          y={180 * s}
          scale={s}
          flipY
          leafFill={pal.leafFill}
          strokeColor={pal.accent}
        />
        <SvgOliveBranch
          x={180 * s}
          y={h - 180 * s}
          scale={s}
          flipX
          leafFill={pal.leafFill}
          strokeColor={pal.accent}
        />
      </>
    );
  }

  if (config.preset === "CLASSICO_ORO") {
    const m = 26;
    return (
      <g>
        <rect
          x={m}
          y={m}
          width={w - m * 2}
          height={h - m * 2}
          fill="none"
          stroke={pal.accent}
          strokeWidth="1.6"
          strokeOpacity="0.7"
        />
        <rect
          x={m + 6}
          y={m + 6}
          width={w - (m + 6) * 2}
          height={h - (m + 6) * 2}
          fill="none"
          stroke={pal.accent}
          strokeWidth="0.8"
          strokeOpacity="0.4"
        />
        <SvgStar cx={m} cy={m} r={7} fill={pal.accent} />
        <SvgStar cx={w - m} cy={m} r={7} fill={pal.accent} />
        <SvgStar cx={m} cy={h - m} r={7} fill={pal.accent} />
        <SvgStar cx={w - m} cy={h - m} r={7} fill={pal.accent} />
      </g>
    );
  }

  if (config.preset === "HERITAGE_VINTAGE") {
    const m = 28;
    return (
      <g>
        <rect
          x={m}
          y={m}
          width={w - m * 2}
          height={h - m * 2}
          fill="none"
          stroke={pal.accent}
          strokeWidth="2.8"
        />
        <circle cx={m + 12} cy={m + 12} r="4.5" fill={pal.accent} />
        <circle cx={w - m - 12} cy={m + 12} r="4.5" fill={pal.accent} />
        <circle cx={m + 12} cy={h - m - 12} r="4.5" fill={pal.accent} />
        <circle cx={w - m - 12} cy={h - m - 12} r="4.5" fill={pal.accent} />
      </g>
    );
  }

  if (config.preset === "MODERNO_MINIMAL") {
    return <rect x={0} y={0} width={18} height={h} fill={pal.accent} />;
  }

  return null;
}

/** Medaglione / Logo in coordinate SVG centrato in (cx, cy) con raggio r */
function SvgBrandEmblem({
  cx,
  cy,
  r,
  config,
  attivita,
  lato = "fronte",
}: {
  cx: number;
  cy: number;
  r: number;
  config: CartaGraficaConfig;
  attivita: DatiAttivitaCarta;
  lato?: "fronte" | "retro";
}) {
  const pal = paletteLato(config, lato);
  const iniziali = inizialiBrand(attivita.nome);

  if (attivita.logoHeroUrl) {
    const size = r * 2.15;
    return (
      <image
        href={attivita.logoHeroUrl}
        x={cx - size / 2}
        y={cy - size / 2}
        width={size}
        height={size}
        preserveAspectRatio="xMidYMid meet"
      />
    );
  }

  if (attivita.logoUrl) {
    const imgSize = r * 1.5;
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={pal.accent}
          strokeWidth="2"
          strokeOpacity="0.85"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r - 7}
          fill="none"
          stroke={pal.accent}
          strokeWidth="0.9"
          strokeOpacity="0.45"
        />
        <SvgStar cx={cx} cy={cy - r} r={7} fill={pal.accent} />
        <SvgStar cx={cx} cy={cy + r} r={7} fill={pal.accent} />
        <image
          href={attivita.logoUrl}
          x={cx - imgSize / 2}
          y={cy - imgSize / 2}
          width={imgSize}
          height={imgSize}
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    );
  }

  // Fallback vettoriale: doppio anello + geometria sacra + stelline + monogramma perfettamente centrato
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.65}
        fill="none"
        stroke={pal.accent}
        strokeWidth="0.8"
        strokeOpacity="0.22"
      />
      <circle
        cx={cx}
        cy={cy - r * 0.22}
        r={r * 0.44}
        fill="none"
        stroke={pal.accent}
        strokeWidth="0.7"
        strokeOpacity="0.18"
      />
      <circle
        cx={cx}
        cy={cy + r * 0.22}
        r={r * 0.44}
        fill="none"
        stroke={pal.accent}
        strokeWidth="0.7"
        strokeOpacity="0.18"
      />
      <circle
        cx={cx - r * 0.22}
        cy={cy}
        r={r * 0.44}
        fill="none"
        stroke={pal.accent}
        strokeWidth="0.7"
        strokeOpacity="0.18"
      />
      <circle
        cx={cx + r * 0.22}
        cy={cy}
        r={r * 0.44}
        fill="none"
        stroke={pal.accent}
        strokeWidth="0.7"
        strokeOpacity="0.18"
      />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={pal.accent} strokeWidth="2.2" />
      <circle
        cx={cx}
        cy={cy}
        r={r - 7}
        fill="none"
        stroke={pal.accent}
        strokeWidth="0.9"
        strokeOpacity="0.5"
      />
      <SvgStar cx={cx} cy={cy - r} r={8} fill={pal.accent} />
      <SvgStar cx={cx} cy={cy + r} r={8} fill={pal.accent} />
      <text
        x={cx}
        y={cy + r * 0.26}
        textAnchor="middle"
        fill={pal.accent}
        fontFamily="Georgia, 'Cormorant Garamond', 'Times New Roman', serif"
        fontSize={r * 0.78}
        fontStyle="italic"
        fontWeight="600"
        letterSpacing="2"
      >
        {iniziali}
      </text>
    </g>
  );
}

/** Tronca una stringa se supera maxChars per evitare sbordamenti in SVG */
function tronca(str: string, maxChars: number): string {
  const s = (str || "").trim();
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars - 1).trim() + "…";
}

/**
 * FRONTE DEL BIGLIETTO DA VISITA (SVG vettoriale puro 850×550 = 85×55 mm)
 * Centratura matematica garantita su qualsiasi schermo e in stampa.
 */
export function BigliettoFronte({
  config,
  attivita,
  mostraGuideTaglio = false,
  className = "",
}: {
  config: CartaGraficaConfig;
  attivita: DatiAttivitaCarta;
  mostraGuideTaglio?: boolean;
  className?: string;
}) {
  const pal = paletteLato(config, "fronte");
  const fontMain =
    config.preset === "MODERNO_MINIMAL"
      ? "Inter, system-ui, -apple-system, sans-serif"
      : "Georgia, 'Cormorant Garamond', 'Times New Roman', serif";

  const partiIndirizzo = (attivita.indirizzo || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const rigaIndirizzo1 = tronca(partiIndirizzo[0] || attivita.indirizzo || "", 34);
  const rigaIndirizzo2 = tronca(
    partiIndirizzo.slice(1).join(", ") || attivita.citta || "",
    34
  );

  const sottotitolo = tronca(config.sottotitoloBrand || "", 20);
  const firma = tronca(config.firmaBrand || "", 28);
  const sovratitolo = tronca(config.sovratitoloSede || "", 22);
  const sedeOspite = tronca(config.nomeSedeOspite || attivita.nome || "ATTIVITÀ", 22);

  const orariCompatti = tronca(
    attivita.orariRaggruppati
      .filter((o) => !o.chiuso)
      .map((o) => `${o.giorno}: ${o.orario}`)
      .join(" • "),
    46
  );

  const leftCx = 218;

  return (
    <div
      className={`relative w-full overflow-hidden select-none ${className}`}
      style={{ aspectRatio: "85 / 55" }}
    >
      <svg
        viewBox="0 0 850 550"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fondo */}
        <rect x="0" y="0" width="850" height="550" fill={pal.bg} />

        {/* Sfondo personalizzato */}
        {config.sfondoFronteUrl && (
          <>
            <image
              href={config.sfondoFronteUrl}
              x="0"
              y="0"
              width="850"
              height="550"
              preserveAspectRatio={
                config.sfondoFit === "contain" ? "xMidYMid meet" : "xMidYMid slice"
              }
            />
            {config.veloOpacitaFronte > 0 && (
              <rect
                x="0"
                y="0"
                width="850"
                height="550"
                fill={pal.bg}
                fillOpacity={config.veloOpacitaFronte / 100}
              />
            )}
          </>
        )}

        {/* Ornamenti del Preset */}
        <SvgOrnamentiPreset config={config} lato="fronte" w={850} h={550} />

        {/* Contenuto Fronte */}
        {!config.nascondiTestiFronte && (
          <g fontFamily={fontMain}>
            {/* COLONNA SINISTRA: Medaglione + Sottotitolo + Firma */}
            <SvgBrandEmblem
              cx={leftCx}
              cy={220}
              r={112}
              config={config}
              attivita={attivita}
              lato="fronte"
            />

            {sottotitolo ? (
              <g>
                <line
                  x1={leftCx - 135}
                  y1={392}
                  x2={leftCx - 92}
                  y2={392}
                  stroke={pal.accent}
                  strokeWidth="1.5"
                />
                <text
                  x={leftCx}
                  y={399}
                  textAnchor="middle"
                  fill={pal.textPrimary}
                  fontSize="21"
                  fontWeight="600"
                  letterSpacing="5"
                >
                  {sottotitolo.toUpperCase()}
                </text>
                <line
                  x1={leftCx + 92}
                  y1={392}
                  x2={leftCx + 135}
                  y2={392}
                  stroke={pal.accent}
                  strokeWidth="1.5"
                />
              </g>
            ) : (
              <text
                x={leftCx}
                y={402}
                textAnchor="middle"
                fill={pal.textPrimary}
                fontSize="22"
                fontWeight="600"
                letterSpacing="3"
              >
                {tronca(attivita.nome, 20).toUpperCase()}
              </text>
            )}

            {firma && (
              <text
                x={leftCx}
                y={434}
                textAnchor="middle"
                fill={pal.textSecondary}
                fontSize="17"
                letterSpacing="1.5"
              >
                {firma}
              </text>
            )}

            {/* DIVISORE VERTICALE CENTRALE CON STELLINA ✦ */}
            <line
              x1="425"
              y1="72"
              x2="425"
              y2="255"
              stroke={pal.accent}
              strokeWidth="1.5"
              strokeOpacity="0.8"
            />
            <SvgStar cx={425} cy={275} r={10} fill={pal.accent} />
            <line
              x1="425"
              y1="295"
              x2="425"
              y2="478"
              stroke={pal.accent}
              strokeWidth="1.5"
              strokeOpacity="0.8"
            />

            {/* COLONNA DESTRA: Sede, Indirizzo, Telefono */}
            {sovratitolo && (
              <text
                x="468"
                y="170"
                fill={pal.textSecondary}
                fontSize="34"
                fontStyle="italic"
                fontFamily="Georgia, 'Cormorant Garamond', serif"
              >
                {sovratitolo}
              </text>
            )}

            <text
              x="468"
              y={sovratitolo ? 216 : 196}
              fill={pal.textPrimary}
              fontSize={sedeOspite.length > 16 ? "25" : "29"}
              fontWeight="600"
              letterSpacing="3"
            >
              {sedeOspite.toUpperCase()}
            </text>

            {/* Filetto orizzontale oro */}
            <line
              x1="468"
              y1="244"
              x2="788"
              y2="244"
              stroke={pal.accent}
              strokeWidth="1.5"
              strokeOpacity="0.85"
            />

            {/* Indirizzo */}
            {rigaIndirizzo1 && (
              <text x="468" y="292" fill={pal.textPrimary} fontSize="22" letterSpacing="0.5">
                {rigaIndirizzo1}
              </text>
            )}
            {rigaIndirizzo2 && (
              <text x="468" y="324" fill={pal.textPrimary} fontSize="22" letterSpacing="0.5">
                {rigaIndirizzo2}
              </text>
            )}

            {/* Telefono con icona cornetta */}
            {attivita.telefono && (
              <g transform={`translate(468, ${rigaIndirizzo2 ? 356 : 330})`}>
                <path
                  d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"
                  fill={pal.accent}
                  transform="scale(1.05)"
                />
                <text
                  x="32"
                  y="20"
                  fill={pal.textPrimary}
                  fontSize="22"
                  fontWeight="500"
                  letterSpacing="0.8"
                >
                  Cel. {attivita.telefono}
                </text>
              </g>
            )}

            {/* Orari compatti sul fronte (se attivato) */}
            {config.mostraOrariCompattiFronte && orariCompatti && (
              <text
                x="468"
                y="428"
                fill={pal.textSecondary}
                fontSize="14.5"
                letterSpacing="0.4"
              >
                {orariCompatti}
              </text>
            )}

            {/* QR Code discreto sul fronte (se attivato) */}
            {config.mostraQrFronte && attivita.qrVetrinaDataUrl && (
              <g transform="translate(700, 395)">
                <rect
                  x="0"
                  y="0"
                  width="96"
                  height="96"
                  rx="8"
                  fill="#FFFFFF"
                  stroke={pal.accent}
                  strokeWidth="2"
                />
                <image
                  href={attivita.qrVetrinaDataUrl}
                  x="5"
                  y="5"
                  width="86"
                  height="86"
                />
              </g>
            )}
          </g>
        )}

        {/* Guide di taglio tipografiche (4mm = 40 unità su 850x550) */}
        {mostraGuideTaglio && (
          <g>
            <rect
              x="40"
              y="40"
              width="770"
              height="470"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="8 6"
            />
            <rect x="40" y="14" width="245" height="22" rx="4" fill="#0284c7" />
            <text
              x="50"
              y="29"
              fill="#ffffff"
              fontFamily="system-ui, sans-serif"
              fontSize="13"
              fontWeight="700"
            >
              Area sicura di stampa (4 mm)
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

/**
 * RETRO DEL BIGLIETTO DA VISITA (SVG vettoriale puro 850×550 = 85×55 mm)
 */
export function BigliettoRetro({
  config,
  attivita,
  mostraGuideTaglio = false,
  className = "",
}: {
  config: CartaGraficaConfig;
  attivita: DatiAttivitaCarta;
  mostraGuideTaglio?: boolean;
  className?: string;
}) {
  const pal = paletteLato(config, "retro");
  const fontMain =
    config.preset === "MODERNO_MINIMAL"
      ? "Inter, system-ui, -apple-system, sans-serif"
      : "Georgia, 'Cormorant Garamond', 'Times New Roman', serif";

  const righeOrari: OrarioGiornoCarta[] =
    config.modalitaOrariRetro === "RAGGRUPPATO"
      ? attivita.orariRaggruppati
      : config.includiDomenica
      ? attivita.orariGiornalieri
      : attivita.orariGiornalieri.filter((g) => g.giorno !== "DOMENICA");

  const titolo =
    config.contenutoRetro === "APPUNTAMENTI_QR"
      ? "APPUNTAMENTI"
      : (config.titoloRetro || "ORARI").toUpperCase();

  const numRighe = Math.max(1, righeOrari.length);
  const startY = numRighe <= 4 ? 210 : numRighe === 6 ? 175 : 162;
  const stepY = numRighe <= 4 ? 56 : numRighe === 6 ? 45 : 40;

  return (
    <div
      className={`relative w-full overflow-hidden select-none ${className}`}
      style={{ aspectRatio: "85 / 55" }}
    >
      <svg
        viewBox="0 0 850 550"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0" y="0" width="850" height="550" fill={pal.bg} />

        {config.sfondoRetroUrl && (
          <>
            <image
              href={config.sfondoRetroUrl}
              x="0"
              y="0"
              width="850"
              height="550"
              preserveAspectRatio={
                config.sfondoFit === "contain" ? "xMidYMid meet" : "xMidYMid slice"
              }
            />
            {config.veloOpacitaRetro > 0 && (
              <rect
                x="0"
                y="0"
                width="850"
                height="550"
                fill={pal.bg}
                fillOpacity={config.veloOpacitaRetro / 100}
              />
            )}
          </>
        )}

        <SvgOrnamentiPreset config={config} lato="retro" w={850} h={550} />

        {!config.nascondiTestiRetro && (
          <g fontFamily={fontMain}>
            {/* INTESTAZIONE RETRO: ——— O R A R I ——— */}
            <line
              x1="185"
              y1="82"
              x2="310"
              y2="82"
              stroke={pal.accent}
              strokeWidth="1.5"
            />
            <text
              x="425"
              y="91"
              textAnchor="middle"
              fill={pal.textPrimary}
              fontSize="28"
              fontWeight="600"
              letterSpacing="8"
            >
              {titolo}
            </text>
            <line
              x1="540"
              y1="82"
              x2="665"
              y2="82"
              stroke={pal.accent}
              strokeWidth="1.5"
            />

            {config.contenutoRetro === "ORARI" && (
              <g>
                <SvgStar cx={425} cy={128} r={8} fill={pal.accent} />
                <line
                  x1="425"
                  y1="140"
                  x2="425"
                  y2="275"
                  stroke={pal.accent}
                  strokeWidth="1.4"
                  strokeOpacity="0.8"
                />
                <SvgStar cx={425} cy={290} r={9} fill={pal.accent} />
                <line
                  x1="425"
                  y1="305"
                  x2="425"
                  y2="455"
                  stroke={pal.accent}
                  strokeWidth="1.4"
                  strokeOpacity="0.8"
                />

                {righeOrari.map((r, i) => {
                  const y = startY + i * stepY;
                  return (
                    <g key={r.giorno}>
                      <text
                        x="235"
                        y={y}
                        textAnchor="start"
                        fill={pal.textPrimary}
                        fontSize="20"
                        fontWeight="500"
                        letterSpacing="2.5"
                      >
                        {r.giorno}
                      </text>
                      <text
                        x="458"
                        y={y}
                        textAnchor="start"
                        fill={pal.textPrimary}
                        fontSize="20"
                        fontWeight="500"
                        letterSpacing="2"
                      >
                        {r.orario}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {config.contenutoRetro === "ORARI_QR" && (
              <g>
                {righeOrari.map((r, i) => {
                  const y = startY + i * stepY;
                  return (
                    <g key={r.giorno}>
                      <text
                        x="95"
                        y={y}
                        fill={pal.textPrimary}
                        fontSize="18"
                        fontWeight="600"
                        letterSpacing="1.8"
                      >
                        {r.giorno}
                      </text>
                      <text
                        x="295"
                        y={y}
                        fill={pal.textPrimary}
                        fontSize="18"
                        letterSpacing="1.2"
                      >
                        {r.orario}
                      </text>
                    </g>
                  );
                })}

                <line
                  x1="545"
                  y1="140"
                  x2="545"
                  y2="450"
                  stroke={pal.accent}
                  strokeWidth="1.4"
                  strokeOpacity="0.8"
                />
                <SvgStar cx={545} cy={295} r={9} fill={pal.accent} />

                {attivita.qrVetrinaDataUrl && (
                  <g transform="translate(605, 190)">
                    <rect
                      x="0"
                      y="0"
                      width="165"
                      height="165"
                      rx="12"
                      fill="#FFFFFF"
                      stroke={pal.accent}
                      strokeWidth="2.5"
                    />
                    <image
                      href={attivita.qrVetrinaDataUrl}
                      x="10"
                      y="10"
                      width="145"
                      height="145"
                    />
                    <text
                      x="82.5"
                      y="194"
                      textAnchor="middle"
                      fill={pal.textPrimary}
                      fontSize="15"
                      fontWeight="600"
                      letterSpacing="2.5"
                    >
                      PRENOTA ONLINE
                    </text>
                  </g>
                )}
              </g>
            )}

            {config.contenutoRetro === "APPUNTAMENTI_QR" && (
              <g>
                {[0, 1, 2, 3].map((idx) => {
                  const y = 185 + idx * 68;
                  return (
                    <g key={idx}>
                      <text
                        x="95"
                        y={y}
                        fill={pal.textPrimary}
                        fontSize="17"
                        fontWeight="600"
                        letterSpacing="1.5"
                      >
                        DATA:
                      </text>
                      <line
                        x1="165"
                        y1={y + 2}
                        x2="345"
                        y2={y + 2}
                        stroke={pal.accent}
                        strokeWidth="1.5"
                        strokeDasharray="3 4"
                      />
                      <text
                        x="365"
                        y={y}
                        fill={pal.textPrimary}
                        fontSize="17"
                        fontWeight="600"
                        letterSpacing="1.5"
                      >
                        ORA:
                      </text>
                      <line
                        x1="420"
                        y1={y + 2}
                        x2="515"
                        y2={y + 2}
                        stroke={pal.accent}
                        strokeWidth="1.5"
                        strokeDasharray="3 4"
                      />
                    </g>
                  );
                })}

                <line
                  x1="545"
                  y1="140"
                  x2="545"
                  y2="450"
                  stroke={pal.accent}
                  strokeWidth="1.4"
                  strokeOpacity="0.8"
                />
                <SvgStar cx={545} cy={295} r={9} fill={pal.accent} />

                {attivita.qrVetrinaDataUrl && (
                  <g transform="translate(605, 190)">
                    <rect
                      x="0"
                      y="0"
                      width="165"
                      height="165"
                      rx="12"
                      fill="#FFFFFF"
                      stroke={pal.accent}
                      strokeWidth="2.5"
                    />
                    <image
                      href={attivita.qrVetrinaDataUrl}
                      x="10"
                      y="10"
                      width="145"
                      height="145"
                    />
                    <text
                      x="82.5"
                      y="194"
                      textAnchor="middle"
                      fill={pal.textPrimary}
                      fontSize="15"
                      fontWeight="600"
                      letterSpacing="2.5"
                    >
                      PRENOTA ONLINE
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* FILETTO INFERIORE CON STELLINA ✦ */}
            <line
              x1="285"
              y1="490"
              x2="405"
              y2="490"
              stroke={pal.accent}
              strokeWidth="1.4"
            />
            <SvgStar cx={425} cy={490} r={8.5} fill={pal.accent} />
            <line
              x1="445"
              y1="490"
              x2="565"
              y2="490"
              stroke={pal.accent}
              strokeWidth="1.4"
            />
          </g>
        )}

        {mostraGuideTaglio && (
          <rect
            x="40"
            y="40"
            width="770"
            height="470"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="8 6"
          />
        )}
      </svg>
    </div>
  );
}

/**
 * CARD GRAFICA DEL BUONO REGALO / VOUCHER
 * Include SEMPRE il CODICE IDENTIFICATIVO PER SCARICARE IL BUONO in cassa.
 */
export interface DatiBuonoRender {
  codice: string;
  motivoEtichetta: string;
  valore: string;
  saldoResiduo?: number;
  importoIniziale?: number;
  tipoValore?: string;
  destinatario?: string | null;
  acquirente?: string | null;
  messaggio?: string | null;
  scadenzaTesto?: string | null;
  qrDataUrl?: string;
  condizioni?: string[];
  stato?: string;
}

export function BuonoRegaloCard({
  config,
  attivita,
  buono,
  layout = "web",
  className = "",
}: {
  config: CartaGraficaConfig;
  attivita: DatiAttivitaCarta;
  buono: DatiBuonoRender;
  layout?: "web" | "cartoncino" | "cartaceo";
  className?: string;
}) {
  const pal = paletteLato(config, "fronte");
  const sfondoUrl =
    config.sfondoBuonoUrl || (config.usaSfondoFronteSuBuono ? config.sfondoFronteUrl : null);
  const fontMain =
    config.preset === "MODERNO_MINIMAL"
      ? "Inter, system-ui, -apple-system, sans-serif"
      : "Georgia, 'Cormorant Garamond', 'Times New Roman', serif";

  const recapitoRiga1 = tronca(
    [attivita.indirizzo, attivita.citta].filter(Boolean).join(", "),
    38
  );
  const recapitoRiga2 = attivita.telefono ? `Tel. ${attivita.telefono}` : "";

  /* ============================================================================
   * 1. LAYOUT CARTONCINO (Precompilato con QR oppure Cartaceo da compilare a mano)
   *    Proporzione 1050 × 495 (210 × 99 mm — Formato Busta Regalo DL)
   * ============================================================================ */
  if (layout === "cartoncino" || layout === "cartaceo") {
    const isCartaceo = layout === "cartaceo";
    const leftCx = 195;
    const valText = tronca(buono.valore || "75,00 €", 24);
    const valFontSize = valText.length > 16 ? 36 : valText.length > 10 ? 46 : 56;
    const codiceId = (buono.codice || "BUO-XXXXX-XXXXX").toUpperCase();

    return (
      <div
        className={`relative w-full overflow-hidden rounded-2xl shadow-lg select-none ${className}`}
        style={{ aspectRatio: "210 / 99" }}
      >
        <svg
          viewBox="0 0 1050 495"
          className="w-full h-full block"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fondo */}
          <rect x="0" y="0" width="1050" height="495" fill={pal.bg} />

          {/* Sfondo personalizzato */}
          {sfondoUrl && (
            <>
              <image
                href={sfondoUrl}
                x="0"
                y="0"
                width="1050"
                height="495"
                preserveAspectRatio={
                  config.sfondoFit === "contain" ? "xMidYMid meet" : "xMidYMid slice"
                }
              />
              {config.veloOpacitaFronte > 0 && (
                <rect
                  x="0"
                  y="0"
                  width="1050"
                  height="495"
                  fill={pal.bg}
                  fillOpacity={config.veloOpacitaFronte / 100}
                />
              )}
            </>
          )}

          {/* Ornamenti */}
          <SvgOrnamentiPreset config={config} lato="fronte" w={1050} h={495} />

          {/* Cornice interna dorata */}
          <rect
            x="22"
            y="22"
            width="1006"
            height="451"
            rx="18"
            fill="none"
            stroke={pal.accent}
            strokeWidth="1.6"
            strokeOpacity="0.65"
          />

          <g fontFamily={fontMain}>
            {/* COLONNA SINISTRA (x = 30..360, centro = 195): Medaglione + Nome + Recapiti */}
            <SvgBrandEmblem
              cx={leftCx}
              cy={185}
              r={96}
              config={config}
              attivita={attivita}
              lato="fronte"
            />

            <text
              x={leftCx}
              y={324}
              textAnchor="middle"
              fill={pal.textPrimary}
              fontSize="21"
              fontWeight="700"
              letterSpacing="3.5"
            >
              {tronca(attivita.nome, 22).toUpperCase()}
            </text>

            {config.firmaBrand && (
              <text
                x={leftCx}
                y={350}
                textAnchor="middle"
                fill={pal.textSecondary}
                fontSize="15.5"
                letterSpacing="1"
              >
                {tronca(config.firmaBrand, 28)}
              </text>
            )}

            {recapitoRiga1 && (
              <text
                x={leftCx}
                y={392}
                textAnchor="middle"
                fill={pal.textSecondary}
                fontSize="14.5"
              >
                {recapitoRiga1}
              </text>
            )}
            {recapitoRiga2 && (
              <text
                x={leftCx}
                y={416}
                textAnchor="middle"
                fill={pal.textSecondary}
                fontSize="15"
                fontWeight="600"
              >
                {recapitoRiga2}
              </text>
            )}

            {/* DIVISORE VERTICALE A X = 370 */}
            <line
              x1="370"
              y1="58"
              x2="370"
              y2="225"
              stroke={pal.accent}
              strokeWidth="1.5"
              strokeOpacity="0.8"
            />
            <SvgStar cx={370} cy={247.5} r={9.5} fill={pal.accent} />
            <line
              x1="370"
              y1="270"
              x2="370"
              y2="437"
              stroke={pal.accent}
              strokeWidth="1.5"
              strokeOpacity="0.8"
            />

            {isCartaceo ? (
              /* ============================================================
               * MODALITÀ BUONO CARTACEO DA COMPILARE A MANO IN NEGOZIO
               * (Con riquadro CODICE IDENTIFICATIVO PER SCARICARE IL BUONO)
               * ============================================================ */
              <g>
                {/* Titolo */}
                <SvgStar cx={420} cy={76} r={8} fill={pal.accent} />
                <text
                  x="442"
                  y="83"
                  fill={pal.accent}
                  fontSize="21"
                  fontWeight="700"
                  letterSpacing="6"
                >
                  BUONO REGALO
                </text>

                {/* Riga 1: Per */}
                <text x="412" y="138" fill={pal.textPrimary} fontSize="18" fontStyle="italic">
                  Per:
                </text>
                <line
                  x1="460"
                  y1="140"
                  x2="985"
                  y2="140"
                  stroke={pal.accent}
                  strokeWidth="1.5"
                  strokeDasharray="3 5"
                />

                {/* Riga 2: Da parte di */}
                <text x="412" y="190" fill={pal.textPrimary} fontSize="18" fontStyle="italic">
                  Da parte di:
                </text>
                <line
                  x1="522"
                  y1="192"
                  x2="985"
                  y2="192"
                  stroke={pal.accent}
                  strokeWidth="1.5"
                  strokeDasharray="3 5"
                />

                {/* Riga 3: Valore / Servizio */}
                <text x="412" y="244" fill={pal.textPrimary} fontSize="18" fontWeight="600">
                  Valore / Servizio:
                </text>
                <line
                  x1="578"
                  y1="246"
                  x2="985"
                  y2="246"
                  stroke={pal.accent}
                  strokeWidth="1.5"
                  strokeDasharray="3 5"
                />

                {/* Riga 4: Dedica */}
                <text x="412" y="296" fill={pal.textPrimary} fontSize="17" fontStyle="italic">
                  Dedica:
                </text>
                <line
                  x1="485"
                  y1="298"
                  x2="985"
                  y2="298"
                  stroke={pal.accent}
                  strokeWidth="1.5"
                  strokeDasharray="3 5"
                />

                {/* Riga 5: Data emissione e Scadenza */}
                <text x="412" y="348" fill={pal.textSecondary} fontSize="15">
                  Emesso il:
                </text>
                <line
                  x1="498"
                  y1="350"
                  x2="665"
                  y2="350"
                  stroke={pal.accent}
                  strokeWidth="1.3"
                  strokeDasharray="2 4"
                />
                <text x="690" y="348" fill={pal.textSecondary} fontSize="15">
                  Valido fino al:
                </text>
                <line
                  x1="802"
                  y1="350"
                  x2="985"
                  y2="350"
                  stroke={pal.accent}
                  strokeWidth="1.3"
                  strokeDasharray="2 4"
                />

                {/* Riquadro ufficiale CODICE IDENTIFICATIVO PER SCARICARE IL BUONO */}
                <rect
                  x="412"
                  y="374"
                  width="573"
                  height="64"
                  rx="10"
                  fill={pal.isScuro ? "#FFFFFF14" : "#00000008"}
                  stroke={pal.accent}
                  strokeWidth="1.8"
                />
                <text
                  x="430"
                  y="398"
                  fill={pal.accent}
                  fontSize="11.5"
                  fontWeight="700"
                  letterSpacing="2"
                >
                  CODICE IDENTIFICATIVO PER SCARICARE IL BUONO IN CASSA:
                </text>
                {buono.codice && buono.codice.trim() !== "" ? (
                  <text
                    x="430"
                    y="426"
                    fill={pal.textPrimary}
                    fontFamily="monospace"
                    fontSize="22"
                    fontWeight="700"
                    letterSpacing="2.5"
                  >
                    {buono.codice.trim().toUpperCase()}
                  </text>
                ) : (
                  <line
                    x1="430"
                    y1="424"
                    x2="965"
                    y2="424"
                    stroke={pal.accent}
                    strokeWidth="1.2"
                    strokeDasharray="3 4"
                  />
                )}
              </g>
            ) : (
              /* ============================================================
               * MODALITÀ BUONO PRECOMPILATO CON VALORE, CODICE IDENTIFICATIVO E QR
               * ============================================================ */
              <g>
                {/* Etichetta motivo */}
                <SvgStar cx={418} cy={80} r={7.5} fill={pal.accent} />
                <text
                  x="436"
                  y="86"
                  fill={pal.accent}
                  fontSize="17"
                  fontWeight="700"
                  letterSpacing="5"
                >
                  {(buono.motivoEtichetta || "BUONO REGALO").toUpperCase()}
                </text>

                {/* Valore principale su 1 sola riga ben proporzionata */}
                <text
                  x="412"
                  y="162"
                  fill={pal.textPrimary}
                  fontSize={valFontSize}
                  fontWeight="700"
                >
                  {valText}
                </text>

                {/* Destinatario e Acquirente */}
                {buono.destinatario && (
                  <text x="412" y="210" fill={pal.textSecondary} fontSize="19">
                    Per:{" "}
                    <tspan fill={pal.textPrimary} fontWeight="700">
                      {tronca(buono.destinatario, 22)}
                    </tspan>
                    {buono.acquirente ? `  •  Da: ${tronca(buono.acquirente, 18)}` : ""}
                  </text>
                )}

                {/* Messaggio di auguri */}
                {buono.messaggio && (
                  <text
                    x="412"
                    y="248"
                    fill={pal.textSecondary}
                    fontSize="16.5"
                    fontStyle="italic"
                  >
                    “{tronca(buono.messaggio, 44)}”
                  </text>
                )}

                {/* RIQUADRO CODICE IDENTIFICATIVO PER SCARICARE IL BUONO */}
                <g transform="translate(412, 272)">
                  <rect
                    x="0"
                    y="0"
                    width="370"
                    height="72"
                    rx="10"
                    fill={pal.isScuro ? "#FFFFFF14" : "#0000000A"}
                    stroke={pal.accent}
                    strokeWidth="1.8"
                  />
                  <text
                    x="16"
                    y="24"
                    fill={pal.accent}
                    fontSize="11"
                    fontWeight="700"
                    letterSpacing="1.8"
                  >
                    CODICE IDENTIFICATIVO PER SCARICARE IL BUONO:
                  </text>
                  <text
                    x="16"
                    y="55"
                    fill={pal.textPrimary}
                    fontFamily="monospace"
                    fontSize="24"
                    fontWeight="700"
                    letterSpacing="2.5"
                  >
                    {codiceId}
                  </text>
                </g>

                {/* Condizioni sotto al riquadro codice */}
                {(buono.condizioni || []).slice(0, 2).map((c, idx) => (
                  <text
                    key={idx}
                    x="412"
                    y={378 + idx * 24}
                    fill={pal.textSecondary}
                    fontSize="13.5"
                  >
                    • {tronca(c, 56)}
                  </text>
                ))}

                {/* Box QR Code a destra (x = 810..990) */}
                {buono.qrDataUrl && (
                  <g transform="translate(812, 118)">
                    <rect
                      x="0"
                      y="0"
                      width="178"
                      height="178"
                      rx="16"
                      fill="#FFFFFF"
                      stroke={pal.accent}
                      strokeWidth="3"
                    />
                    <image
                      href={buono.qrDataUrl}
                      x="11"
                      y="11"
                      width="156"
                      height="156"
                    />
                    <text
                      x="89"
                      y="206"
                      textAnchor="middle"
                      fill={pal.textSecondary}
                      fontSize="12"
                      fontWeight="600"
                      letterSpacing="1.5"
                    >
                      SCANSIONA IN CASSA
                    </text>
                    <text
                      x="89"
                      y="228"
                      textAnchor="middle"
                      fill={pal.accent}
                      fontFamily="monospace"
                      fontSize="16"
                      fontWeight="700"
                      letterSpacing="1.5"
                    >
                      {codiceId}
                    </text>
                  </g>
                )}
              </g>
            )}
          </g>
        </svg>
      </div>
    );
  }

  /* ============================================================================
   * 2. LAYOUT WEB / SMARTPHONE & INTESTAZIONE A4 (SVG 800 × 520)
   *    Include anche qui il box con il CODICE IDENTIFICATIVO PER SCARICARE IL BUONO
   * ============================================================================ */
  const valWeb = tronca(buono.valore || "75,00 €", 24);
  const valWebSize = valWeb.length > 16 ? 40 : valWeb.length > 10 ? 50 : 60;
  const codiceIdWeb = (buono.codice || "BUO-XXXXX-XXXXX").toUpperCase();

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl shadow-xl select-none ${className}`}
      style={{ aspectRatio: "800 / 520" }}
    >
      <svg
        viewBox="0 0 800 520"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0" y="0" width="800" height="520" fill={pal.bg} />

        {sfondoUrl && (
          <>
            <image
              href={sfondoUrl}
              x="0"
              y="0"
              width="800"
              height="520"
              preserveAspectRatio={
                config.sfondoFit === "contain" ? "xMidYMid meet" : "xMidYMid slice"
              }
            />
            {config.veloOpacitaFronte > 0 && (
              <rect
                x="0"
                y="0"
                width="800"
                height="520"
                fill={pal.bg}
                fillOpacity={config.veloOpacitaFronte / 100}
              />
            )}
          </>
        )}

        <SvgOrnamentiPreset config={config} lato="fronte" w={800} h={520} />

        <rect
          x="20"
          y="20"
          width="760"
          height="480"
          rx="20"
          fill="none"
          stroke={pal.accent}
          strokeWidth="1.5"
          strokeOpacity="0.65"
        />

        <g fontFamily={fontMain}>
          <SvgBrandEmblem
            cx={400}
            cy={108}
            r={64}
            config={config}
            attivita={attivita}
            lato="fronte"
          />

          <text
            x="400"
            y="204"
            textAnchor="middle"
            fill={pal.textPrimary}
            fontSize="21"
            fontWeight="700"
            letterSpacing="4"
          >
            {tronca(attivita.nome, 28).toUpperCase()}
          </text>

          {/* Filetto + Etichetta motivo */}
          <line
            x1="200"
            y1="234"
            x2="295"
            y2="234"
            stroke={pal.accent}
            strokeWidth="1.3"
          />
          <SvgStar cx={312} cy={234} r={6.5} fill={pal.accent} />
          <text
            x="400"
            y="240"
            textAnchor="middle"
            fill={pal.accent}
            fontSize="14.5"
            fontWeight="700"
            letterSpacing="4"
          >
            {(buono.motivoEtichetta || "BUONO REGALO").toUpperCase()}
          </text>
          <SvgStar cx={488} cy={234} r={6.5} fill={pal.accent} />
          <line
            x1="505"
            y1="234"
            x2="600"
            y2="234"
            stroke={pal.accent}
            strokeWidth="1.3"
          />

          {buono.destinatario && (
            <text
              x="400"
              y="274"
              textAnchor="middle"
              fill={pal.textSecondary}
              fontSize="18"
            >
              Per{" "}
              <tspan fill={pal.textPrimary} fontWeight="700">
                {tronca(buono.destinatario, 26)}
              </tspan>
            </text>
          )}

          <text
            x="400"
            y={buono.destinatario ? 340 : 322}
            textAnchor="middle"
            fill={pal.textPrimary}
            fontSize={valWebSize}
            fontWeight="700"
          >
            {valWeb}
          </text>

          {buono.messaggio && (
            <text
              x="400"
              y="382"
              textAnchor="middle"
              fill={pal.textSecondary}
              fontSize="16.5"
              fontStyle="italic"
            >
              “{tronca(buono.messaggio, 54)}”
            </text>
          )}

          {/* Badge Codice Identificativo Buono in basso */}
          <rect
            x="185"
            y="404"
            width="430"
            height="68"
            rx="12"
            fill={pal.isScuro ? "#FFFFFF14" : "#0000000A"}
            stroke={pal.accent}
            strokeWidth="1.6"
          />
          <text
            x="400"
            y="426"
            textAnchor="middle"
            fill={pal.accent}
            fontSize="11"
            fontWeight="700"
            letterSpacing="2"
          >
            CODICE IDENTIFICATIVO PER SCARICARE IL BUONO
          </text>
          <text
            x="400"
            y="456"
            textAnchor="middle"
            fill={pal.textPrimary}
            fontFamily="monospace"
            fontSize="23"
            fontWeight="700"
            letterSpacing="3"
          >
            {codiceIdWeb}
          </text>
        </g>
      </svg>
    </div>
  );
}
