import { readFileSync } from "fs";
import { join } from "path";

const KEYS_DIR = join(__dirname, "../../keys");
const PRIVATE_KEY_PATH = join(KEYS_DIR, "private.pem");
const PUBLIC_KEY_PATH = join(KEYS_DIR, "public.pem");

let privateKey: string;
let publicKey: string;

/**
 * Loads RSA keys for JWT signing/verification.
 * Keys should be generated using the generate:keys script.
 *
 * @throws Error if keys are not found
 */
function loadKeys() {
  try {
    privateKey = readFileSync(PRIVATE_KEY_PATH, "utf-8");
    publicKey = readFileSync(PUBLIC_KEY_PATH, "utf-8");
  } catch (error) {
    throw new Error('RSA keys not found. Run "pnpm generate:keys" to generate them.');
  }
}

// Load keys on module initialization
loadKeys();

export { privateKey, publicKey };
