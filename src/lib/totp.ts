import crypto from "crypto";
import bcrypt from "bcryptjs";

// Alfabeto RFC 4648 Base32
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/[\s-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue; // ignora caratteri non validi
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Genera un secret TOTP casuale di 20 byte codificato in Base32 (32 caratteri)
 */
export function generateTotpSecret(): string {
  const randomBytes = crypto.randomBytes(20);
  return base32Encode(randomBytes);
}

/**
 * Calcola il codice TOTP a 6 cifre per un dato timestamp (secondi)
 */
export function generateTotpCode(secretBase32: string, timestampSeconds: number = Math.floor(Date.now() / 1000)): string {
  const key = base32Decode(secretBase32);
  const timeStep = 30; // 30 secondi
  const counter = Math.floor(timestampSeconds / timeStep);

  // Buffer di 8 byte per il counter big-endian
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226)
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Verifica se il codice inserito dall'utente è valido per il secret dato (tolleranza ±1 step da 30s)
 */
export function verifyTotpCode(code: string, secretBase32: string, windowSteps: number = 1): boolean {
  if (!code || !secretBase32) return false;
  const cleanCode = code.trim().replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleanCode)) return false;

  const currentSeconds = Math.floor(Date.now() / 1000);
  const timeStep = 30;

  for (let i = -windowSteps; i <= windowSteps; i++) {
    const checkSeconds = currentSeconds + i * timeStep;
    const expected = generateTotpCode(secretBase32, checkSeconds);
    if (crypto.timingSafeEqual(Buffer.from(cleanCode), Buffer.from(expected))) {
      return true;
    }
  }

  return false;
}

/**
 * Genera l'URI otpauth standard per la scansione tramite QR Code
 */
export function generateOtpauthUri(email: string, secretBase32: string, issuer: string = "Taaaac Suite"): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Genera 8 codici di recupero monouso in formato XXXX-XXXX
 */
export function generateBackupCodes(count: number = 8): string[] {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // senza caratteri ambigui come 0/O, 1/I
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    let part1 = "";
    let part2 = "";
    const rand = crypto.randomBytes(8);
    for (let j = 0; j < 4; j++) part1 += chars[rand[j] % chars.length];
    for (let j = 4; j < 8; j++) part2 += chars[rand[j] % chars.length];
    codes.push(`${part1}-${part2}`);
  }

  return codes;
}

/**
 * Esegue l'hash dei codici di backup per salvarli in modo sicuro nel DB
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const hashed: string[] = [];
  for (const code of codes) {
    const clean = code.toUpperCase().trim();
    hashed.push(await bcrypt.hash(clean, 10));
  }
  return hashed;
}

/**
 * Verifica e consuma un codice di backup. Restituisce la nuova lista aggiornata se valido, o null se non valido.
 */
export async function verifyAndConsumeBackupCode(
  inputCode: string,
  hashedCodesJson: string | null | undefined
): Promise<{ valid: boolean; remainingCodesJson: string | null }> {
  if (!inputCode || !hashedCodesJson) return { valid: false, remainingCodesJson: null };
  const cleanInput = inputCode.toUpperCase().trim();

  let hashedList: string[] = [];
  try {
    hashedList = JSON.parse(hashedCodesJson);
    if (!Array.isArray(hashedList)) return { valid: false, remainingCodesJson: null };
  } catch {
    return { valid: false, remainingCodesJson: null };
  }

  for (let i = 0; i < hashedList.length; i++) {
    const isMatch = await bcrypt.compare(cleanInput, hashedList[i]);
    if (isMatch) {
      // Rimuovi il codice consumato
      hashedList.splice(i, 1);
      return {
        valid: true,
        remainingCodesJson: JSON.stringify(hashedList),
      };
    }
  }

  return { valid: false, remainingCodesJson: null };
}
