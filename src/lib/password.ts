/** Shared password helpers for auth + admin password management. */

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  /** Tailwind background token for the meter fill. */
  color: string;
  /** Human-readable suggestions to reach a stronger password. */
  hints: string[];
};

export const MIN_PASSWORD_LENGTH = 8;

/** Deterministic, dependency-free strength estimate. */
export function scorePassword(password: string): PasswordStrength {
  const hints: string[] = [];
  let score = 0;

  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  else hints.push(`Use at least ${MIN_PASSWORD_LENGTH} characters`);

  if (password.length >= 12) score++;
  else if (password.length >= MIN_PASSWORD_LENGTH)
    hints.push("Longer passwords are stronger (12+)");

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else hints.push("Mix upper and lower case letters");

  if (/\d/.test(password)) {
    if (/[^A-Za-z0-9]/.test(password)) score++;
    else hints.push("Add a symbol (e.g. ! ? # @)");
  } else {
    hints.push("Add a number");
  }

  const clamped = Math.max(0, Math.min(4, score)) as 0 | 1 | 2 | 3 | 4;

  const meta: Record<number, { label: string; color: string }> = {
    0: { label: "Very weak", color: "bg-destructive" },
    1: { label: "Weak", color: "bg-destructive" },
    2: { label: "Fair", color: "bg-amber-500" },
    3: { label: "Good", color: "bg-lime-500" },
    4: { label: "Strong", color: "bg-emerald-600" },
  };

  return { score: clamped, label: meta[clamped].label, color: meta[clamped].color, hints };
}

/** Validation used by every password entry point. Returns an error string or null. */
export function validateNewPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    return "Password must include at least one letter and one number.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

/**
 * Normalize an email exactly the same way everywhere so a manually typed
 * value matches an autofilled / stored one (mobile keyboards often add a
 * trailing space or capitalize the first letter).
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Map Supabase auth errors to clear, actionable messages. */
export function friendlyAuthError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("email not confirmed"))
    return "Your email hasn't been confirmed yet. Check your inbox for the confirmation link.";
  if (m.includes("invalid login credentials"))
    return "The email or password is incorrect. Check for accidental spaces or capital letters, or use “Forgot password”.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("network") || m.includes("failed to fetch"))
    return "Network problem — check your connection and try again.";
  if (m.includes("same password") || m.includes("should be different"))
    return "Your new password must be different from your current one.";
  return message || "Something went wrong. Please try again.";
}
