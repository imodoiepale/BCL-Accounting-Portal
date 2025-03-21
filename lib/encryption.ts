const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// Convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

// Convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function encrypt(text: string): Promise<string> {
  const key = hexToBytes(process.env.EMAIL_ENCRYPTION_KEY!);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits for AES-GCM

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encodedText = textEncoder.encode(text);
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    cryptoKey,
    encodedText
  );

  // Combine IV and encrypted data
  const result = new Uint8Array(iv.length + new Uint8Array(encryptedData).length);
  result.set(iv);
  result.set(new Uint8Array(encryptedData), iv.length);

  return bytesToHex(result);
}

export async function decrypt(encryptedHex: string): Promise<string> {
  const encrypted = hexToBytes(encryptedHex);
  const iv = encrypted.slice(0, 12);
  const data = encrypted.slice(12);

  const key = hexToBytes(process.env.EMAIL_ENCRYPTION_KEY!);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    cryptoKey,
    data
  );

  return textDecoder.decode(decrypted);
}
