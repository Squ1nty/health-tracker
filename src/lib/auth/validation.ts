export const NAME_MAX = 50;
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
// Upper bound stops someone posting megabytes for the server to hash.
export const PASSWORD_MAX = 128;

// Deliberately loose: one @, no spaces, a dot in the domain. The same
// pattern (lowercase only) is enforced by the users collection validator.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthField = "name" | "email" | "password" | "confirmPassword";
export type FieldErrors = Partial<Record<AuthField, string>>;

type Result<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

function validateEmail(raw: string, errors: FieldErrors) {
  const email = raw.trim().toLowerCase();
  if (!email) {
    errors.email = "Enter your email address.";
  } else if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  return email;
}

export function validateSignup(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Result<{ name: string; email: string; password: string }> {
  const errors: FieldErrors = {};

  // Collapse runs of whitespace so "  Jane   Doe " is stored as "Jane Doe".
  const name = input.name.trim().replace(/\s+/g, " ");
  if (!name) {
    errors.name = "Enter your name.";
  } else if (name.length > NAME_MAX) {
    errors.name = `Name must be ${NAME_MAX} characters or fewer.`;
  }

  const email = validateEmail(input.email, errors);

  const { password, confirmPassword } = input;
  if (!password) {
    errors.password = "Enter a password.";
  } else if (password.length < PASSWORD_MIN) {
    errors.password = `Password must be at least ${PASSWORD_MIN} characters.`;
  } else if (password.length > PASSWORD_MAX) {
    errors.password = `Password must be ${PASSWORD_MAX} characters or fewer.`;
  } else if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    errors.password = "Password must include at least one letter and one number.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords don't match.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { name, email, password } };
}

// Login only checks the fields are present and well-formed; password rules
// aren't repeated here so they can change without locking out old accounts.
export function validateLogin(input: {
  email: string;
  password: string;
}): Result<{ email: string; password: string }> {
  const errors: FieldErrors = {};

  const email = validateEmail(input.email, errors);

  if (!input.password) {
    errors.password = "Enter your password.";
  } else if (input.password.length > PASSWORD_MAX) {
    errors.password = `Password must be ${PASSWORD_MAX} characters or fewer.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { email, password: input.password } };
}
