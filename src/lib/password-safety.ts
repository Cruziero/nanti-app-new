export type PasswordSafetyResult = {
  compromised: boolean;
  count: number;
};

async function sha1Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/**
 * Privacy-preserving breached-password check.
 * The password is hashed locally and only the first 5 SHA-1 characters are
 * sent to HIBP's Pwned Passwords range API.
 */
export async function checkPasswordSafety(
  password: string,
): Promise<PasswordSafetyResult> {
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const response = await fetch(
    `https://api.pwnedpasswords.com/range/${prefix}`,
    {
      headers: {
        "Add-Padding": "true",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Password safety service unavailable.");
  }

  const body = await response.text();
  for (const line of body.split(/\r?\n/)) {
    const [candidate, count] = line.trim().split(":");
    if (candidate?.toUpperCase() === suffix) {
      return {
        compromised: true,
        count: Number(count || 0),
      };
    }
  }

  return { compromised: false, count: 0 };
}
