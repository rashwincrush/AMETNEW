const COMMON = ['password','passw0rd','123456','qwerty','letmein','admin','welcome','iloveyou'];

export function validatePassword(pw, email) {
  if (!pw || pw.length < 12) return { ok: false, message: 'Password must be at least 12 characters long.' };

  const lowers = /[a-z]/.test(pw);
  const uppers = /[A-Z]/.test(pw);
  const digits = /\d/.test(pw);
  const symbols = /[^A-Za-z0-9]/.test(pw);
  const classes = [lowers, uppers, digits, symbols].filter(Boolean).length;
  if (classes < 3) return { ok: false, message: 'Use a mix of at least three types: lower, UPPER, numbers, symbols.' };

  const local = (email || '').split('@')[0] || '';
  const lowerPw = pw.toLowerCase();
  if (local && lowerPw.includes(local.toLowerCase())) {
    return { ok: false, message: 'Avoid including your email/username.' };
  }
  if (COMMON.some(bad => lowerPw.includes(bad))) {
    return { ok: false, message: 'Avoid common words or sequences.' };
  }
  return { ok: true };
}
