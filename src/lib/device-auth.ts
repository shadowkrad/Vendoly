import { NextRequest } from "next/server";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { prisma } from "./db";
import { isAdminAuthenticated, setAdminSession } from "./auth";

/**
 * Risolve dinamicamente dominio e origine per WebAuthn
 */
export function getWebAuthnConfig(req?: Request | NextRequest) {
  let hostname = "localhost";
  let origin = "http://localhost:3000";

  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    if (host) {
      hostname = host.split(":")[0];
      origin = `${proto}://${host}`;
    }
  } else if (process.env.NEXTAUTH_URL || process.env.TAAAAC_TENANT_DOMAIN) {
    try {
      const u = new URL(process.env.NEXTAUTH_URL || `https://${process.env.TAAAAC_TENANT_DOMAIN}`);
      hostname = u.hostname;
      origin = u.origin;
    } catch {}
  }

  return {
    rpName: "Vendoly Store",
    rpID: hostname,
    origin,
  };
}

/**
 * Salva la challenge crittografica temporanea nel DB con scadenza 2 minuti
 */
async function saveChallenge(challenge: string, purpose: "registration" | "authentication", targetId = "admin") {
  // Pulizia vecchie challenge scadute
  await prisma.webAuthnChallenge.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  }).catch(() => {});

  await prisma.webAuthnChallenge.create({
    data: {
      challenge,
      purpose,
      targetId,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minuti
    },
  });
}

/**
 * Verifica e consuma una challenge esistente
 */
async function consumeChallenge(challenge: string, purpose: "registration" | "authentication"): Promise<boolean> {
  const record = await prisma.webAuthnChallenge.findUnique({
    where: { challenge },
  });

  if (!record || record.purpose !== purpose || record.expiresAt < new Date()) {
    return false;
  }

  await prisma.webAuthnChallenge.delete({
    where: { id: record.id },
  }).catch(() => {});

  return true;
}

/**
 * Genera le opzioni per registrare un nuovo dispositivo (FaceID, TouchID, PIN)
 */
export async function createDeviceRegistrationOptions(req: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return { ok: false, error: "Accesso non autorizzato: effettua prima il login con PIN/password", status: 401 };
  }

  const existingDevices = await prisma.registeredDevice.findMany({
    where: { status: "ACTIVE" },
    select: { credentialId: true, transports: true },
  });

  const config = getWebAuthnConfig(req);

  const options = await generateRegistrationOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userName: "admin@vendoly.store",
    userID: new TextEncoder().encode("vendoly-admin-user"),
    userDisplayName: "Amministratore Vendoly",
    attestationType: "none",
    excludeCredentials: existingDevices.map((d) => ({
      id: d.credentialId,
      transports: JSON.parse(d.transports || "[]"),
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform", // sensore biometrico / sblocco nativo del dispositivo
    },
  });

  await saveChallenge(options.challenge, "registration");

  return { ok: true, options };
}

/**
 * Valida la registrazione del dispositivo e memorizza la chiave pubblica nel DB
 */
export async function verifyAndSaveDeviceRegistration(
  req: NextRequest,
  body: { response: any; deviceName?: string; deviceType?: string }
) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return { ok: false, error: "Accesso non autorizzato", status: 401 };
  }

  const { response, deviceName, deviceType } = body;
  if (!response?.response?.clientDataJSON) {
    return { ok: false, error: "Dati WebAuthn non validi", status: 400 };
  }

  const clientData = JSON.parse(Buffer.from(response.response.clientDataJSON, "base64url").toString("utf-8"));
  const challengeValid = await consumeChallenge(clientData.challenge, "registration");
  if (!challengeValid) {
    return { ok: false, error: "Challenge di registrazione scaduta o non valida. Riprova.", status: 400 };
  }

  const config = getWebAuthnConfig(req);

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: clientData.challenge,
    expectedOrigin: config.origin,
    expectedRPID: config.rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return { ok: false, error: "Verifica crittografica del dispositivo fallita", status: 400 };
  }

  const { credential, credentialDeviceType } = verification.registrationInfo;

  const credentialIdBase64 = credential.id;
  const publicKeyBase64 = Buffer.from(credential.publicKey).toString("base64url");
  const counter = credential.counter;

  const userAgent = req.headers.get("user-agent") || "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "";

  // Determina nome amichevole del dispositivo
  let cleanName = (deviceName || "").trim();
  if (!cleanName) {
    if (userAgent.includes("iPhone")) cleanName = "Apple iPhone";
    else if (userAgent.includes("iPad")) cleanName = "Apple iPad";
    else if (userAgent.includes("Android")) cleanName = "Dispositivo Android";
    else cleanName = "Terminale Cassa";
  }

  const device = await prisma.registeredDevice.upsert({
    where: { credentialId: credentialIdBase64 },
    update: {
      deviceName: cleanName,
      deviceType: deviceType || credentialDeviceType || "mobile",
      publicKey: publicKeyBase64,
      counter: BigInt(counter),
      transports: JSON.stringify(response.response?.transports || ["internal"]),
      status: "ACTIVE",
      userAgent,
      lastIp: ip,
      lastUsedAt: new Date(),
    },
    create: {
      deviceName: cleanName,
      deviceType: deviceType || credentialDeviceType || "mobile",
      credentialId: credentialIdBase64,
      publicKey: publicKeyBase64,
      counter: BigInt(counter),
      transports: JSON.stringify(response.response?.transports || ["internal"]),
      status: "ACTIVE",
      userAgent,
      lastIp: ip,
      lastUsedAt: new Date(),
    },
  });

  return {
    ok: true,
    message: "Dispositivo registrato con successo!",
    device: {
      id: device.id,
      deviceName: device.deviceName,
      createdAt: device.createdAt,
    },
  };
}

/**
 * Genera le opzioni per il login rapido tramite FaceID / Impronta / PIN
 */
export async function createDeviceLoginOptions(req: NextRequest) {
  const activeDevices = await prisma.registeredDevice.findMany({
    where: { status: "ACTIVE" },
    select: { credentialId: true, transports: true },
  });

  if (activeDevices.length === 0) {
    return { ok: false, error: "Nessun dispositivo autorizzato registrato su questo store", status: 404 };
  }

  const config = getWebAuthnConfig(req);

  const options = await generateAuthenticationOptions({
    rpID: config.rpID,
    userVerification: "preferred",
    allowCredentials: activeDevices.map((d) => ({
      id: d.credentialId,
      transports: JSON.parse(d.transports || "[]"),
    })),
  });

  await saveChallenge(options.challenge, "authentication");

  return { ok: true, options };
}

/**
 * Valida la firma biometrica del dispositivo ed effettua il login
 */
export async function verifyDeviceLoginAndAuthenticate(req: NextRequest, body: { response: any }) {
  const { response } = body;
  if (!response?.id || !response?.response?.clientDataJSON) {
    return { ok: false, error: "Dati di autenticazione biometrica non validi", status: 400 };
  }

  const credentialId = response.id;

  // 1. Cerca il dispositivo registrato nel DB
  const device = await prisma.registeredDevice.findUnique({
    where: { credentialId },
  });

  // 2. CHECK DI SICUREZZA: se non trovato o REVOCATO dall'amministratore, nega immediatamente l'accesso!
  if (!device) {
    return {
      ok: false,
      error: "Dispositivo non riconosciuto. Accedi prima con password.",
      status: 401,
    };
  }

  if (device.status !== "ACTIVE") {
    return {
      ok: false,
      error: "Questo dispositivo è stato SCOLLEGATO dall'amministratore. Effettua l'accesso principale.",
      status: 403,
    };
  }

  const clientData = JSON.parse(Buffer.from(response.response.clientDataJSON, "base64url").toString("utf-8"));
  const challengeValid = await consumeChallenge(clientData.challenge, "authentication");
  if (!challengeValid) {
    return { ok: false, error: "Challenge di autenticazione scaduta. Riprova.", status: 400 };
  }

  const config = getWebAuthnConfig(req);

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: clientData.challenge,
    expectedOrigin: config.origin,
    expectedRPID: config.rpID,
    credential: {
      id: device.credentialId,
      publicKey: Uint8Array.from(Buffer.from(device.publicKey, "base64url")),
      counter: Number(device.counter),
      transports: JSON.parse(device.transports || "[]"),
    },
  });

  if (!verification.verified) {
    return { ok: false, error: "Verifica firma biometrica non riuscita", status: 401 };
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "";

  // Aggiorna contatore e data ultimo utilizzo
  await prisma.registeredDevice.update({
    where: { id: device.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
      lastIp: ip,
    },
  });

  // Rilascia sessione amministratore
  await setAdminSession();

  return {
    ok: true,
    message: "Accesso autorizzato con successo!",
    device: {
      id: device.id,
      deviceName: device.deviceName,
    },
  };
}

/**
 * Elenco di tutti i dispositivi registrati (per la gestione in Impostazioni)
 */
export async function listAllRegisteredDevices() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return { ok: false, error: "Non autorizzato", status: 401 };
  }

  const devices = await prisma.registeredDevice.findMany({
    orderBy: [
      { status: "asc" }, // ACTIVE prima
      { lastUsedAt: "desc" },
    ],
    select: {
      id: true,
      deviceName: true,
      deviceType: true,
      status: true,
      lastIp: true,
      userAgent: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

  return { ok: true, devices };
}

/**
 * Revoca e scollega un dispositivo da remoto
 */
export async function revokeDevice(deviceId: string) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return { ok: false, error: "Non autorizzato", status: 401 };
  }

  const device = await prisma.registeredDevice.findUnique({
    where: { id: deviceId },
  });

  if (!device) {
    return { ok: false, error: "Dispositivo non trovato", status: 404 };
  }

  await prisma.registeredDevice.update({
    where: { id: deviceId },
    data: { status: "REVOKED" },
  });

  return {
    ok: true,
    message: `Dispositivo "${device.deviceName}" scollegato con successo! Non potrà più accedere via biometria/PIN.`,
  };
}

/**
 * Elimina definitivamente un dispositivo registrato
 */
export async function deleteDevice(deviceId: string) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return { ok: false, error: "Non autorizzato", status: 401 };
  }

  await prisma.registeredDevice.delete({
    where: { id: deviceId },
  }).catch(() => {});

  return { ok: true, message: "Dispositivo eliminato definitivamente" };
}
