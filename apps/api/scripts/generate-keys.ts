#!/usr/bin/env node
/* eslint-disable no-console */

import { generateKeyPairSync } from "crypto";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const KEYS_DIR = join(__dirname, "../keys");
const PRIVATE_KEY_PATH = join(KEYS_DIR, "private.pem");
const PUBLIC_KEY_PATH = join(KEYS_DIR, "public.pem");

function generateRSAKeys() {
  console.log("Generating RSA-2048 key pair for JWT signing...");

  // Create keys directory if it doesn't exist
  if (!existsSync(KEYS_DIR)) {
    mkdirSync(KEYS_DIR, { recursive: true });
    console.log(`✓ Created directory: ${KEYS_DIR}`);
  }

  // Generate RSA key pair
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  // Write keys to files
  writeFileSync(PRIVATE_KEY_PATH, privateKey);
  writeFileSync(PUBLIC_KEY_PATH, publicKey);

  console.log(`✓ Private key saved to: ${PRIVATE_KEY_PATH}`);
  console.log(`✓ Public key saved to: ${PUBLIC_KEY_PATH}`);
  console.log("\n✓ RSA key pair generated successfully!");
  console.log("\nNOTE: Keep private.pem secure and never commit it to version control.");
}

// Run the generator
try {
  generateRSAKeys();
} catch (error) {
  console.error("Error generating keys:", error);
  process.exit(1);
}
