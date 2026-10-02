import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// scrypt cost parameters (OWASP-recommended: N=2^15, r=8, p=3). They're
// stored inside each hash, so they can be raised later without breaking
// existing accounts.
const PARAMS = { N: 2 ** 15, r: 8, p: 3 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function derive(
  password: string,
  salt: Buffer,
  params: { N: number; r: number; p: number },
  keyLength: number
) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      // Normalize so the same password typed on different keyboards/OSes
      // (composed vs decomposed accents) produces the same hash.
      password.normalize("NFKC"),
      salt,
      keyLength,
      // scrypt needs 128 * N * r bytes; the default limit is just under that.
      { ...params, maxmem: 256 * params.N * params.r },
      (error, key) => (error ? reject(error) : resolve(key))
    );
  });
}

// Format: scrypt$N$r$p$salt$hash (salt and hash base64).
export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt, PARAMS, KEY_LENGTH);
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, N, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "base64");
  const actual = await derive(
    password,
    Buffer.from(salt, "base64"),
    { N: Number(N), r: Number(r), p: Number(p) },
    expected.length
  );
  return timingSafeEqual(actual, expected);
}
