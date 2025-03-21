import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// Only check for environment variable on the server side
const isServer = typeof window === 'undefined';
let ENCRYPTION_KEY: Buffer;

if (isServer) {
  if (!process.env.EMAIL_ENCRYPTION_KEY) {
    throw new Error('EMAIL_ENCRYPTION_KEY environment variable is required');
  }
  // Convert the hex key to a buffer
  ENCRYPTION_KEY = Buffer.from(process.env.EMAIL_ENCRYPTION_KEY, 'hex');

  if (ENCRYPTION_KEY.length !== 32) {
    throw new Error('EMAIL_ENCRYPTION_KEY must be exactly 32 bytes when decoded from hex');
  }
}

export function encrypt(text: string): string {
  if (!isServer) {
    throw new Error('Encryption can only be performed on the server side');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV, encrypted data, and auth tag
  return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
}

export function decrypt(encryptedData: string): string {
  if (!isServer) {
    throw new Error('Decryption can only be performed on the server side');
  }

  const [ivHex, encryptedHex, authTagHex] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted.toString('utf8');
}
