// src/core/crypto.ts
// Web Crypto API AES-GCM (256-bit) encryption for sensitive credentials in local storage
const ENTROPY_KEY = '_cb_sec_entropy_v1';
const SALT_STRING = 'codebook-ai-keystore-v1';

let cachedCryptoKeyPromise: Promise<CryptoKey | null> | null = null;

function bufferToHex(bytes: Uint8Array): string {
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
}

function hexToBytes(hex: string): Uint8Array | null {
    if (hex.length % 2 !== 0) return null;
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        const byte = parseInt(hex.slice(i, i + 2), 16);
        if (Number.isNaN(byte)) return null;
        bytes[i / 2] = byte;
    }
    return bytes;
}

async function getOrCreateCryptoKey(): Promise<CryptoKey | null> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
        return null;
    }

    if (cachedCryptoKeyPromise) {
        return cachedCryptoKeyPromise;
    }

    cachedCryptoKeyPromise = (async () => {
        try {
            let rawEntropy = localStorage.getItem(ENTROPY_KEY);
            if (!rawEntropy) {
                const randomBytes = new Uint8Array(32);
                window.crypto.getRandomValues(randomBytes);
                rawEntropy = bufferToHex(randomBytes);
                localStorage.setItem(ENTROPY_KEY, rawEntropy);
            }

            const encoder = new TextEncoder();
            const keyMaterial = await window.crypto.subtle.importKey(
                'raw',
                encoder.encode(rawEntropy),
                { name: 'PBKDF2' },
                false,
                ['deriveKey']
            );

            const salt = encoder.encode(SALT_STRING);
            return await window.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt,
                    iterations: 100000,
                    hash: 'SHA-256',
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
        } catch (err) {
            console.warn('[crypto] Could not derive Web Crypto key:', err);
            cachedCryptoKeyPromise = null;
            return null;
        }
    })();

    return cachedCryptoKeyPromise;
}

export async function encryptSecret(plaintext: string): Promise<string> {
    if (!plaintext) return '';
    try {
        const key = await getOrCreateCryptoKey();
        if (!key) return plaintext;

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();
        const ciphertextBuffer = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoder.encode(plaintext)
        );

        const ivHex = bufferToHex(iv);
        const ctHex = bufferToHex(new Uint8Array(ciphertextBuffer));
        return `enc:v1:${ivHex}:${ctHex}`;
    } catch (e) {
        console.warn('[crypto] Failed to encrypt secret, falling back:', e);
        return plaintext;
    }
}

export async function decryptSecret(encryptedPayload: string): Promise<string> {
    if (!encryptedPayload) return '';
    if (!encryptedPayload.startsWith('enc:v1:')) {
        // Plaintext fallback for legacy / unencrypted entries
        return encryptedPayload;
    }

    try {
        const parts = encryptedPayload.split(':');
        if (parts.length !== 4) return '';
        const ivHex = parts[2];
        const ctHex = parts[3];

        const iv = hexToBytes(ivHex);
        const ct = hexToBytes(ctHex);
        if (!iv || !ct) return '';

        const key = await getOrCreateCryptoKey();
        if (!key) return '';

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv as BufferSource },
            key,
            ct as BufferSource
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (e) {
        console.warn('[crypto] Failed to decrypt secret:', e);
        return '';
    }
}
