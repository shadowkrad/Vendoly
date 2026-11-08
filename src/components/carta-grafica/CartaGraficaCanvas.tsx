"use client";

import React from "react";
import {
  CartaGraficaConfig,
  DatiAttivitaCarta,
  OrarioGiornoCarta,
  inizialiBrand,
  paletteLato,
} from "@/lib/carta-grafica-types";

/** Stellina a 4 punte ✦ usata sui divisori e sui medaglioni */
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

/** Ramo d'ulivo botanico vettoriale per gli angoli (stile BF Estetica) */
export function RamoUlivoCornerSvg({
  leafFill,
  strokeColor,
  position,
}: {
  leafFill: string;
  strokeColor: string;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}) {
  const transformMap: Record<typeof position, string> = {
    "bottom-right": "rotate(0)",
    "bottom-left": "scale(-1, 1)",
    "top-right": "scale(1, -1)",
    "top-left": "scale(-1, -1)",
  };

  const posStyle: Record<typeof position, React.CSSProperties> = {
    "bottom-right": { right: 0, bottom: 0 },
    "bottom-left": { left: 0, bottom: 0 },
    "top-right": { right: 0, top: 0 },
    "top-left": { left: 0, top: 0 },
  };

  return (
    <svg
      viewBox="0 0 180 180"
      className="pointer-events-none absolute w-[30%] h-[48%]"
      style={{
        ...posStyle[position],
        transform: transformMap[position],
      }}
      aria-hidden="true"
    >
      {/* Stelo dorato principale */}
      <path
        d="M175 180 C150 140, 125 95, 95 45"
        stroke={strokeColor}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M150 180 C145 148, 152 115, 168 78"
        stroke={strokeColor}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Foglie d'ulivo */}
      <path
        d="M102 52 C84 36, 78 18, 92 14 C106 24, 110 40, 102 52 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <path
        d="M112 75 C86 68, 70 55, 65 40 C85 42, 104 56, 112 75 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <path
        d="M116 72 C122 50, 136 35, 152 30 C146 50, 132 66, 116 72 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <path
        d="M128 104 C98 98, 82 85, 74 68 C96 72, 116 86, 128 104 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <path
        d="M132 100 C138 78, 154 62, 170 56 C164 78, 148 94, 132 100 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <path
        d="M144 136 C114 130, 96 118, 88 102 C110 104, 130 118, 144 136 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <path
        d="M158 118 C162 96, 170 82, 178 72 C178 92, 170 108, 158 118 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <path
        d="M156 164 C126 160, 106 150, 96 136 C118 136, 140 148, 156 164 Z"
        fill={leafFill}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
    </svg>
  );
}

/** Ornamenti di sfondo e cornice in base al preset selezionato */
export function OrnamentiPreset({
  config,
  lato,
}: {
  config: CartaGraficaConfig;
  lato: "fronte" | "retro";
}) {
  const pal = paletteLato(config, lato);

  if (config.preset === "SFONDO_LIBERO") return null;

  if (config.preset === "BOTANICO_LUXURY") {
    return (
      <>
        {lato === "fronte" ? (
          <RamoUlivoCornerSvg
            leafFill={pal.leafFill}
            strokeColor={pal.accent}
            position="bottom-right"
          />
        ) : (
          <>
            <RamoUlivoCornerSvg
              leafFill={pal.leafFill}
              strokeColor={pal.accent}
              position="top-right"
            />
            <RamoUlivoCornerSvg
              leafFill={pal.leafFill}
              strokeColor={pal.accent}
              position="bottom-left"
            />
          </>
        )}
      </>
    );
  }

  if (config.preset === "CLASSICO_ORO") {
    return (
      <div className="pointer-events-none absolute inset-[4%] border" style={{ borderColor: `${pal.accent}88` }}>
        <div
          className="absolute inset-[3px] border"
          style={{ borderColor: `${pal.accent}44` }}
        />
        <StellinaSvg color={pal.accent} size={10} className="absolute -top-1.5 -left-1.5" />
        <StellinaSvg color={pal.accent} size={10} className="absolute -top-1.5 -right-1.5" />
        <StellinaSvg color={pal.accent} size={10} className="absolute -bottom-1.5 -left-1.5" />
        <StellinaSvg color={pal.accent} size={10} className="absolute -bottom-1.5 -right-1.5" />
      </div>
    );
  }

  if (config.preset === "HERITAGE_VINTAGE") {
    return (
      <div
        className="pointer-events-none absolute inset-[4.5%] border-2"
        style={{ borderColor: pal.accent }}
      >
        <span
          className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: pal.accent }}
        />
        <span
          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: pal.accent }}
        />
        <span
          className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: pal.accent }}
        />
        <span
          className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: pal.accent }}
        />
      </div>
    );
  }

  if (config.preset === "MODERNO_MINIMAL") {
    return (
      <div
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-[2.2%]"
        style={{ backgroundColor: pal.accent }}
      />
    );
  }

  return null;
}

/** Medaglione / Logo intelligente (mai tagliato da object-cover) */
export function BrandEmblem({
  config,
  attivita,
  lato = "fronte",
  sizeClass = "w-28 h-28",
}: {
  config: CartaGraficaConfig;
  attivita: DatiAttivitaCarta;
  lato?: "fronte" | "retro";
  sizeClass?: string;
}) {
  const pal = paletteLato(config, lato);
  const iniziali = inizialiBrand(attivita.nome);

  // Se l'attività ha un medaglione circolare dedicato (logoHeroUrl), mostriamolo a pieno formato
  if (attivita.logoHeroUrl) {
    return (
      <div className={`relative flex items-center justify-center ${sizeClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attivita.logoHeroUrl}
          alt={attivita.nome}
          className="w-full h-full object-contain drop-shadow-xs"
        />
      </div>
    );
  }

  // Se c'è un logo standard (anche orizzontale), lo incorniciamo o mostriamo in object-contain senza tagliarlo
  if (attivita.logoUrl) {
    return (
      <div className={`relative flex items-center justify-center ${sizeClass}`}>
        <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full" aria-hidden="true">
          <circle cx="80" cy="80" r="72" fill="none" stroke={pal.accent} strokeWidth="1.2" opacity="0.85" />
          <circle cx="80" cy="80" r="66" fill="none" stroke={pal.accent} strokeWidth="0.6" opacity="0.45" />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attivita.logoUrl}
          alt={attivita.nome}
          className="w-[76%] h-[76%] object-contain z-10"
        />
      </div>
    );
  }

  // Fallback: Medaglione vettoriale con monogramma e rami d'ulivo / stelline
  return (
    <div className={`relative flex items-center justify-center ${sizeClass}`}>
      <svg viewBox="0 0 180 180" className="w-full h-full" aria-hidden="true">
        {/* Cerchi sacri interni */}
        <circle cx="90" cy="90" r="46" fill="none" stroke={pal.accent} strokeWidth="0.5" opacity="0.22" />
        <circle cx="90" cy="74" r="32" fill="none" stroke={pal.accent} strokeWidth="0.5" opacity="0.18" />
        <circle cx="90" cy="106" r="32" fill="none" stroke={pal.accent} strokeWidth="0.5" opacity="0.18" />
        <circle cx="74" cy="90" r="32" fill="none" stroke={pal.accent} strokeWidth="0.5" opacity="0.18" />
        <circle cx="106" cy="90" r="32" fill="none" stroke={pal.accent} strokeWidth="0.5" opacity="0.18" />
        {/* Anello dorato principale */}
        <circle cx="90" cy="90" r="72" fill="none" stroke={pal.accent} strokeWidth="1.3" />
        {/* Stellina superiore e inferiore */}
        <path
          d="M90 10 C91 15, 93 17, 98 18 C93 19, 91 21, 90 26 C89 21, 87 19, 82 18 C87 17, 89 15, 90 10 Z"
          fill={pal.accent}
        />
        <path
          d="M90 154 C91 159, 93 161, 98 162 C93 163, 91 165, 90 170 C89 165, 87 163, 82 162 C87 161, 89 159, 90 154 Z"
          fill={pal.accent}
        />
        {/* Monogramma centrale */}
        <text
          x="90"
          y="108"
          textAnchor="middle"
          fill={pal.accent}
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="58"
          fontStyle="italic"
          fontWeight="600"
          letterSpacing="2"
        >
          {iniziali}
        </text>
      </svg>
    </div>
  );
}

/** Guide di taglio e margine di sicurezza (solo per anteprima nell'Editor Visivo) */
function GuideTipograficheOverlay({ mostra }: { mostra?: boolean }) {
  if (!mostra) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {/* Area sicura interna (4mm su 85x55mm ~ 4.7% x 7.2%) */}
      <div
        className="absolute border border-dashed border-sky-400/80"
        style={{ left: "4.7%", right: "4.7%", top: "7.2%", bottom: "7.2%" }}
      >
        <span className="absolute -top-4 left-1 bg-sky-500/90 text-white text-[9px] font-sans px-1.5 py-0.2 rounded">
          Area sicura di stampa (4 mm dal bordo)
        </span>
      </div>
    </div>
  );
}

/**
 * FRONTE DEL BIGLIETTO DA VISITA (proporzione 85×55 mm = 17:11)
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

  // Separazione indirizzo su 2 righe se contiene virgola
  const partiIndirizzo = (attivita.indirizzo || "").split(",").map((s) => s.trim()).filter(Boolean);
  const rigaIndirizzo1 = partiIndirizzo[0] || attivita.indirizzo || "Via / Piazza";
  const rigaIndirizzo2 =
    partiIndirizzo.slice(1).join(", ") || attivita.citta || "";

  const sottotitolo = (config.sottotitoloBrand || "").trim();
  const firma = (config.firmaBrand || "").trim();
  const sovratitolo = (config.sovratitoloSede || "").trim();
  const sedeOspite = (config.nomeSedeOspite || "").trim() || attivita.nome;

  const orariCompatti = attivita.orariRaggruppati
    .filter((o) => !o.chiuso)
    .map((o) => `${o.giorno}: ${o.orario}`)
    .join(" • ");

  return (
    <div
      className={`relative w-full aspect-[85/55] overflow-hidden select-none ${className}`}
      style={{
        backgroundColor: pal.bg,
        color: pal.textPrimary,
        fontFamily:
          config.preset === "MODERNO_MINIMAL"
            ? "Inter, system-ui, sans-serif"
            : "Georgia, 'Cormorant Garamond', 'Times New Roman', serif",
      }}
    >
      {/* Sfondo Personalizzato (se caricato) */}
      {config.sfondoFronteUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.sfondoFronteUrl}
            alt=""
            className="pointer-events-none absolute inset-0 w-full h-full"
            style={{ objectFit: config.sfondoFit }}
          />
          {config.veloOpacitaFronte > 0 && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundColor: pal.bg,
                opacity: config.veloOpacitaFronte / 100,
              }}
            />
          )}
        </>
      )}

      {/* Ornamenti vettoriali del preset */}
      <OrnamentiPreset config={config} lato="fronte" />

      {/* Guide tipografiche nell'editor */}
      <GuideTipograficheOverlay mostra={mostraGuideTaglio} />

      {/* Contenuto testuale/logo del fronte (nascosto se l'utente ha caricato uno sfondo già completo) */}
      {!config.nascondiTestiFronte && (
        <div className="relative z-10 w-full h-full grid grid-cols-[48%_4%_48%] items-center px-[6%] py-[5%]">
          {/* COLONNA SINISTRA: Medaglione + Sottotitolo + Firma */}
          <div className="flex flex-col items-center justify-center text-center pr-1">
            <BrandEmblem
              config={config}
              attivita={attivita}
              lato="fronte"
              sizeClass="w-[64%] aspect-square max-w-[140px]"
            />

            {sottotitolo ? (
              <div className="mt-1.5 flex items-center justify-center gap-2 w-full">
                <span
                  className="h-[1px] flex-1 max-w-[26px]"
                  style={{ backgroundColor: pal.accent }}
                />
                <span
                  className="text-[11px] sm:text-xs tracking-[0.26em] uppercase font-medium whitespace-nowrap"
                  style={{ color: pal.textPrimary }}
                >
                  {sottotitolo}
                </span>
                <span
                  className="h-[1px] flex-1 max-w-[26px]"
                  style={{ backgroundColor: pal.accent }}
                />
              </div>
            ) : (
              <div
                className="mt-1.5 text-xs sm:text-sm tracking-[0.18em] uppercase font-semibold"
                style={{ color: pal.textPrimary }}
              >
                {attivita.nome}
              </div>
            )}

            {firma && (
              <div
                className="mt-0.5 text-[10px] sm:text-[11px] tracking-wider opacity-90"
                style={{ color: pal.textSecondary }}
              >
                {firma}
              </div>
            )}
          </div>

          {/* DIVISORE CENTRALE VERTICALE CON STELLINA ✦ */}
          <div className="h-[78%] flex flex-col items-center justify-center">
            <div
              className="w-[1px] flex-1"
              style={{ backgroundColor: `${pal.accent}AA` }}
            />
            <StellinaSvg color={pal.accent} size={13} className="my-1 shrink-0" />
            <div
              className="w-[1px] flex-1"
              style={{ backgroundColor: `${pal.accent}AA` }}
            />
          </div>

          {/* COLONNA DESTRA: Presso / Sede + Indirizzo + Telefono (+ eventuale QR/Orari in Solo Fronte) */}
          <div className="flex flex-col justify-center pl-3 pr-2 text-left">
            {sovratitolo && (
              <div
                className="text-base sm:text-lg italic leading-none mb-0.5"
                style={{
                  color: pal.textSecondary,
                  fontFamily: "'Snell Roundhand', 'Brush Script MT', 'Cormorant Garamond', Georgia, serif",
                }}
              >
                {sovratitolo}
              </div>
            )}

            <div
              className="text-sm sm:text-base font-medium tracking-[0.14em] uppercase leading-snug"
              style={{ color: pal.textPrimary }}
            >
              {sedeOspite}
            </div>

            {attivita.slogan && !sovratitolo && (
              <div
                className="text-[10px] italic opacity-85 mt-0.5"
                style={{ color: pal.textSecondary }}
              >
                {attivita.slogan}
              </div>
            )}

            {/* Filetto orizzontale oro */}
            <div
              className="w-full h-[1px] my-2"
              style={{ backgroundColor: `${pal.accent}AA` }}
            />

            {/* Indirizzo */}
            <div
              className="text-[11px] sm:text-xs leading-snug space-y-0.5"
              style={{ color: pal.textPrimary }}
            >
              {rigaIndirizzo1 && <div>{rigaIndirizzo1}</div>}
              {rigaIndirizzo2 && <div>{rigaIndirizzo2}</div>}
            </div>

            {/* Telefono */}
            {attivita.telefono && (
              <div
                className="mt-2 flex items-center gap-1.5 text-[11px] sm:text-xs font-medium tracking-wide"
                style={{ color: pal.textPrimary }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill={pal.accent}
                  className="shrink-0"
                  aria-hidden="true"
                >
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" />
                </svg>
                <span>Cel. {attivita.telefono}</span>
              </div>
            )}

            {/* Orari compatti sul fronte (opzionale, utile per SOLO_FRONTE) */}
            {config.mostraOrariCompattiFronte && orariCompatti && (
              <div
                className="mt-1.5 text-[9px] leading-tight opacity-90 line-clamp-2"
                style={{ color: pal.textSecondary }}
              >
                {orariCompatti}
              </div>
            )}

            {/* QR Code discreto sul fronte (se attivato) */}
            {config.mostraQrFronte && attivita.qrVetrinaDataUrl && (
              <div className="mt-2 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attivita.qrVetrinaDataUrl}
                  alt="QR Prenota"
                  className="w-9 h-9 rounded bg-white p-0.5 border"
                  style={{ borderColor: pal.accent }}
                />
                <span className="text-[9px] uppercase tracking-wider opacity-85">
                  Prenota online
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * RETRO DEL BIGLIETTO DA VISITA (proporzione 85×55 mm = 17:11)
 * Legge in automatico gli orari ufficiali dell'attività da anagrafica-attivita.ts
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

  const righeOrari: OrarioGiornoCarta[] =
    config.modalitaOrariRetro === "RAGGRUPPATO"
      ? attivita.orariRaggruppati
      : config.includiDomenica
      ? attivita.orariGiornalieri
      : attivita.orariGiornalieri.filter((g) => g.giorno !== "DOMENICA");

  return (
    <div
      className={`relative w-full aspect-[85/55] overflow-hidden select-none ${className}`}
      style={{
        backgroundColor: pal.bg,
        color: pal.textPrimary,
        fontFamily:
          config.preset === "MODERNO_MINIMAL"
            ? "Inter, system-ui, sans-serif"
            : "Georgia, 'Cormorant Garamond', 'Times New Roman', serif",
      }}
    >
      {/* Sfondo Personalizzato Retro (se caricato) */}
      {config.sfondoRetroUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.sfondoRetroUrl}
            alt=""
            className="pointer-events-none absolute inset-0 w-full h-full"
            style={{ objectFit: config.sfondoFit }}
          />
          {config.veloOpacitaRetro > 0 && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundColor: pal.bg,
                opacity: config.veloOpacitaRetro / 100,
              }}
            />
          )}
        </>
      )}

      {/* Ornamenti vettoriali del preset */}
      <OrnamentiPreset config={config} lato="retro" />

      {/* Guide tipografiche nell'editor */}
      <GuideTipograficheOverlay mostra={mostraGuideTaglio} />

      {!config.nascondiTestiRetro && (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-between px-[8%] py-[6%]">
          {/* INTESTAZIONE RETRO (es. ——— O R A R I ———) */}
          <div className="w-full flex items-center justify-center gap-3">
            <span
              className="h-[1px] flex-1 max-w-[75px]"
              style={{ backgroundColor: pal.accent }}
            />
            <span
              className="text-sm sm:text-base tracking-[0.32em] uppercase font-semibold"
              style={{ color: pal.textPrimary }}
            >
              {config.contenutoRetro === "APPUNTAMENTI_QR"
                ? "PROSSIMI APPUNTAMENTI"
                : config.titoloRetro || "ORARI"}
            </span>
            <span
              className="h-[1px] flex-1 max-w-[75px]"
              style={{ backgroundColor: pal.accent }}
            />
          </div>

          {/* CORPO CENTRALE DEL RETRO */}
          {config.contenutoRetro === "ORARI" && (
            <div className="w-full flex-1 grid grid-cols-[45%_10%_45%] items-center my-1">
              {/* Giorni a sinistra */}
              <div className="flex flex-col justify-center space-y-1 text-left pl-4 sm:pl-6">
                {righeOrari.map((r) => (
                  <div
                    key={r.giorno}
                    className="text-[10px] sm:text-[11px] tracking-[0.14em] uppercase font-medium leading-tight"
                    style={{ color: pal.textPrimary }}
                  >
                    {r.giorno}
                  </div>
                ))}
              </div>

              {/* Divisore verticale con stelline ✦ in alto e al centro */}
              <div className="h-full flex flex-col items-center justify-center">
                <StellinaSvg color={pal.accent} size={10} className="mb-0.5 shrink-0" />
                <div
                  className="w-[1px] flex-1"
                  style={{ backgroundColor: `${pal.accent}AA` }}
                />
                <StellinaSvg color={pal.accent} size={11} className="my-0.5 shrink-0" />
                <div
                  className="w-[1px] flex-1"
                  style={{ backgroundColor: `${pal.accent}AA` }}
                />
              </div>

              {/* Orari a destra */}
              <div className="flex flex-col justify-center space-y-1 text-left pl-2">
                {righeOrari.map((r) => (
                  <div
                    key={r.giorno}
                    className="text-[10px] sm:text-[11px] tracking-[0.1em] uppercase font-medium leading-tight"
                    style={{ color: pal.textPrimary }}
                  >
                    {r.orario}
                  </div>
                ))}
              </div>
            </div>
          )}

          {config.contenutoRetro === "ORARI_QR" && (
            <div className="w-full flex-1 grid grid-cols-[62%_6%_32%] items-center my-1">
              <div className="space-y-1 pr-2">
                {righeOrari.map((r) => (
                  <div
                    key={r.giorno}
                    className="flex items-center justify-between text-[9.5px] sm:text-[10.5px] tracking-wider uppercase"
                  >
                    <span className="font-semibold">{r.giorno}</span>
                    <span>{r.orario}</span>
                  </div>
                ))}
              </div>
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-[1px] flex-1" style={{ backgroundColor: `${pal.accent}AA` }} />
                <StellinaSvg color={pal.accent} size={10} className="my-1" />
                <div className="w-[1px] flex-1" style={{ backgroundColor: `${pal.accent}AA` }} />
              </div>
              <div className="flex flex-col items-center justify-center text-center pl-2">
                {attivita.qrVetrinaDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attivita.qrVetrinaDataUrl}
                    alt="QR"
                    className="w-16 h-16 bg-white p-1 rounded border"
                    style={{ borderColor: pal.accent }}
                  />
                )}
                <span className="mt-1 text-[8.5px] uppercase tracking-widest font-semibold">
                  Prenota Online
                </span>
              </div>
            </div>
          )}

          {config.contenutoRetro === "APPUNTAMENTI_QR" && (
            <div className="w-full flex-1 grid grid-cols-[62%_6%_32%] items-center my-1">
              <div className="space-y-2.5 pr-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-end gap-2 text-[10px]">
                    <span className="uppercase tracking-wider opacity-80">Data:</span>
                    <span
                      className="flex-1 border-b border-dotted h-3"
                      style={{ borderColor: pal.accent }}
                    />
                    <span className="uppercase tracking-wider opacity-80">Ora:</span>
                    <span
                      className="w-14 border-b border-dotted h-3"
                      style={{ borderColor: pal.accent }}
                    />
                  </div>
                ))}
              </div>
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-[1px] flex-1" style={{ backgroundColor: `${pal.accent}AA` }} />
                <StellinaSvg color={pal.accent} size={10} className="my-1" />
                <div className="w-[1px] flex-1" style={{ backgroundColor: `${pal.accent}AA` }} />
              </div>
              <div className="flex flex-col items-center justify-center text-center pl-2">
                {attivita.qrVetrinaDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attivita.qrVetrinaDataUrl}
                    alt="QR"
                    className="w-16 h-16 bg-white p-1 rounded border"
                    style={{ borderColor: pal.accent }}
                  />
                )}
                <span className="mt-1 text-[8.5px] uppercase tracking-widest font-semibold">
                  Prenota Online
                </span>
              </div>
            </div>
          )}

          {/* FILETTO INFERIORE CON STELLINA ✦ */}
          <div className="w-full flex items-center justify-center gap-2">
            <span
              className="h-[1px] flex-1 max-w-[70px]"
              style={{ backgroundColor: pal.accent }}
            />
            <StellinaSvg color={pal.accent} size={11} />
            <span
              className="h-[1px] flex-1 max-w-[70px]"
              style={{ backgroundColor: pal.accent }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * CARD GRAFICA DEL BUONO REGALO / VOUCHER
 * Usata nell'Editor Visivo, nella pagina pubblica /buono/[token] e nella stampa Cartoncino/A4
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
  layout?: "web" | "cartoncino";
  className?: string;
}) {
  const pal = paletteLato(config, "fronte");
  const sfondoUrl =
    config.sfondoBuonoUrl || (config.usaSfondoFronteSuBuono ? config.sfondoFronteUrl : null);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl shadow-xl select-none ${
        layout === "cartoncino" ? "aspect-[210/99] w-full rounded-2xl" : "w-full"
      } ${className}`}
      style={{
        backgroundColor: pal.bg,
        color: pal.textPrimary,
        fontFamily:
          config.preset === "MODERNO_MINIMAL"
            ? "Inter, system-ui, sans-serif"
            : "Georgia, 'Cormorant Garamond', 'Times New Roman', serif",
      }}
    >
      {/* Sfondo personalizzato sul buono */}
      {sfondoUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sfondoUrl}
            alt=""
            className="pointer-events-none absolute inset-0 w-full h-full"
            style={{ objectFit: config.sfondoFit }}
          />
          {config.veloOpacitaFronte > 0 && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundColor: pal.bg,
                opacity: config.veloOpacitaFronte / 100,
              }}
            />
          )}
        </>
      )}

      {/* Ornamenti vettoriali */}
      <OrnamentiPreset config={config} lato="fronte" />

      {/* Cornice interna dorata */}
      <div
        className="pointer-events-none absolute inset-3 rounded-2xl border"
        style={{ borderColor: `${pal.accent}66` }}
      />

      {layout === "cartoncino" ? (
        /* LAYOUT CARTONCINO PANORAMICO (210×99 mm per busta regalo) */
        <div className="relative z-10 w-full h-full grid grid-cols-[34%_3%_63%] items-center px-[5%] py-[4%]">
          {/* Sinistra: Medaglione + Nome + Recapiti */}
          <div className="flex flex-col items-center justify-center text-center pr-2">
            <BrandEmblem
              config={config}
              attivita={attivita}
              lato="fronte"
              sizeClass="w-24 h-24"
            />
            <div className="mt-1.5 text-xs tracking-[0.2em] uppercase font-semibold">
              {attivita.nome}
            </div>
            {config.firmaBrand && (
              <div className="text-[10px] opacity-85" style={{ color: pal.textSecondary }}>
                {config.firmaBrand}
              </div>
            )}
            <div
              className="mt-2 text-[9.5px] opacity-85 leading-snug"
              style={{ color: pal.textSecondary }}
            >
              {[attivita.indirizzo, attivita.citta].filter(Boolean).join(" - ")}
              {attivita.telefono ? ` • Tel. ${attivita.telefono}` : ""}
            </div>
          </div>

          {/* Divisore verticale con stellina */}
          <div className="h-[82%] flex flex-col items-center justify-center">
            <div className="w-[1px] flex-1" style={{ backgroundColor: `${pal.accent}99` }} />
            <StellinaSvg color={pal.accent} size={12} className="my-1" />
            <div className="w-[1px] flex-1" style={{ backgroundColor: `${pal.accent}99` }} />
          </div>

          {/* Destra: Dettagli del Buono + QR Code */}
          <div className="flex items-center justify-between gap-4 pl-3 pr-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <StellinaSvg color={pal.accent} size={10} />
                <span
                  className="text-[10px] tracking-[0.28em] uppercase font-semibold"
                  style={{ color: pal.accent }}
                >
                  {buono.motivoEtichetta}
                </span>
              </div>

              <div
                className="mt-1 text-3xl sm:text-4xl font-bold leading-tight"
                style={{ color: pal.textPrimary }}
              >
                {buono.valore}
              </div>

              {buono.destinatario && (
                <div className="mt-1 text-xs" style={{ color: pal.textSecondary }}>
                  Per: <strong style={{ color: pal.textPrimary }}>{buono.destinatario}</strong>
                  {buono.acquirente ? ` • Da: ${buono.acquirente}` : ""}
                </div>
              )}

              {buono.messaggio && (
                <p
                  className="mt-1.5 text-xs italic line-clamp-2"
                  style={{ color: pal.textSecondary }}
                >
                  “{buono.messaggio}”
                </p>
              )}

              {buono.condizioni && buono.condizioni.length > 0 && (
                <div
                  className="mt-2 pt-1.5 border-t text-[9px] opacity-85 space-y-0.5"
                  style={{ borderColor: `${pal.accent}55`, color: pal.textSecondary }}
                >
                  {buono.condizioni.slice(0, 2).map((c) => (
                    <div key={c}>• {c}</div>
                  ))}
                </div>
              )}
            </div>

            {buono.qrDataUrl && (
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="p-1.5 bg-white rounded-xl border-2 shadow-sm"
                  style={{ borderColor: pal.accent }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={buono.qrDataUrl} alt="QR Buono" className="w-20 h-20 block" />
                </div>
                <span
                  className="mt-1 font-mono text-[11px] font-bold tracking-widest"
                  style={{ color: pal.accent }}
                >
                  {buono.codice}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* LAYOUT WEB / MOBILE CARD */
        <div className="relative z-10 p-6 sm:p-7 flex flex-col items-center text-center">
          <BrandEmblem
            config={config}
            attivita={attivita}
            lato="fronte"
            sizeClass="w-24 h-24"
          />

          <div className="mt-2 text-base font-bold tracking-[0.18em] uppercase">
            {attivita.nome}
          </div>
          {config.firmaBrand && (
            <div className="text-xs opacity-85" style={{ color: pal.textSecondary }}>
              {config.firmaBrand}
            </div>
          )}

          {/* Divisore con stellina */}
          <div className="my-3 flex items-center justify-center gap-2.5 w-full max-w-[220px]">
            <span className="h-[1px] flex-1" style={{ backgroundColor: `${pal.accent}99` }} />
            <StellinaSvg color={pal.accent} size={11} />
            <span
              className="text-[10px] tracking-[0.26em] uppercase font-semibold"
              style={{ color: pal.accent }}
            >
              {buono.motivoEtichetta}
            </span>
            <StellinaSvg color={pal.accent} size={11} />
            <span className="h-[1px] flex-1" style={{ backgroundColor: `${pal.accent}99` }} />
          </div>

          {buono.destinatario && (
            <div className="text-sm opacity-90" style={{ color: pal.textSecondary }}>
              Dedicato a <strong style={{ color: pal.textPrimary }}>{buono.destinatario}</strong>
            </div>
          )}

          <div
            className="mt-1 text-4xl sm:text-5xl font-bold tracking-tight"
            style={{ color: pal.textPrimary }}
          >
            {buono.valore}
          </div>

          {buono.tipoValore === "IMPORTO" &&
            typeof buono.saldoResiduo === "number" &&
            typeof buono.importoIniziale === "number" &&
            buono.saldoResiduo !== buono.importoIniziale &&
            buono.stato === "ATTIVA" && (
              <div
                className="mt-1.5 inline-block px-3 py-0.5 rounded-full text-xs font-semibold border"
                style={{ borderColor: pal.accent, color: pal.accent }}
              >
                Credito residuo: {buono.saldoResiduo.toFixed(2)} €
              </div>
            )}

          {buono.messaggio && (
            <p
              className="mt-3 text-sm italic max-w-xs leading-relaxed"
              style={{ color: pal.textSecondary }}
            >
              “{buono.messaggio}”
            </p>
          )}
        </div>
      )}
    </div>
  );
}
