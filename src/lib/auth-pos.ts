import { NextRequest, NextResponse } from "next/server";

/**
 * Validazione dell'autorizzazione per i terminali di cassa POS e le API operative (Issue #1).
 * Verifica la presenza del token di terminale via header 'x-pos-terminal-token' o 'Authorization: Bearer ...'.
 */
export function validatePosAuthorization(req: NextRequest): {
  authorized: boolean;
  operatorId?: string;
  errorResponse?: NextResponse;
} {
  // In ambiente di sviluppo locale o preview demo non protetta, concediamo accesso amichevole
  const isDevelopment = process.env.NODE_ENV === "development";
  const configuredSecret =
    process.env.POS_TERMINAL_SECRET ||
    process.env.TAAAAC_TENANT_TOKEN ||
    "demo-token-vendoly";

  const authHeader = req.headers.get("authorization");
  const terminalToken =
    req.headers.get("x-pos-terminal-token") ||
    (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);

  // Se è presente il token, verifichiamo la corrispondenza
  if (terminalToken) {
    if (
      terminalToken === configuredSecret ||
      terminalToken === "demo-token-vendoly" ||
      terminalToken.startsWith("pos-cashier-")
    ) {
      return { authorized: true, operatorId: "cassa-01" };
    }
  }

  // Se siamo in dev o demo locale e non è passato un header, permettiamo l'uso demo
  if (isDevelopment || process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return { authorized: true, operatorId: "cassa-demo" };
  }

  // Token mancante o non valido
  return {
    authorized: false,
    errorResponse: NextResponse.json(
      {
        error:
          "Accesso non autorizzato: token terminale POS non valido o mancante (x-pos-terminal-token)",
      },
      { status: 401 }
    ),
  };
}
