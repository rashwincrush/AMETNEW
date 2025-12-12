# Security Question Password Reset Flow — Implementation Notes

## What changed (Backend / DB)
- Migration applied to **AMS-AMET** (ref: `gvbtfolcizkzihforqte`).
- New tables:
  - `security_question_attempts` — rate limiting (lookup/verify counts, lockout after repeated failures).
  - `password_reset_tokens` — short-lived tokens for security-question resets.
- RPCs (all `SECURITY DEFINER`):
  - `get_security_question_for_email(p_email, p_ip_address)` — returns question if set, rate-limited, no enumeration.
  - `verify_security_answer_for_reset(p_email, p_answer, p_ip_address)` — verifies answer, issues reset token, rate-limited + lockout.
  - `reset_password_with_security_token(p_token, p_new_password)` — resets password using issued token.
  - `set_my_security_question(p_question, p_answer_plaintext)` — set/update question + hashed answer.
  - `get_my_security_question()` / `verify_my_security_answer(p_answer_plaintext)` — profile-level accessors.
- pgcrypto fixes: functions now run with `search_path = public, extensions` so `crypt`, `gen_salt`, `digest`, `gen_random_bytes` work on hosted Supabase.
- Grants: `anon` can execute the three public reset RPCs; cleanup remains restricted.

## What changed (Frontend)
- **ForgotPassword.js** reworked to a multi-step flow:
  1) Email entry → 2) Choose method → 3a) Security Question → 4a) New password **or** 3b) Email reset link.
  - Security Question card now appears **above** Email Reset Link.
  - Shows remaining attempts/lockout messages, validates password policy before submit.
- **Update Password page** (`/update-password`): SecurityQuestionForm still used for configuring question/answer.
- **Profile edit**: removed stray SecurityQuestionForm (now centralized under Password Configuration).

## How to verify
1) As a logged-in user, go to `/update-password`, set a security question + answer, save.
2) Log out, go to `/forgot-password`, enter the same email, click Continue.
   - You should see Security Question (top) and Email Reset Link (bottom).
3) Answer correctly → set new password.

## Files touched
- Frontend:
  - `frontend/src/components/Auth/ForgotPassword.js`
  - `frontend/src/components/Auth/Profile.js`
- Backend migrations:
  - `supabase/migrations/20251212070000_security_question_reset_flow.sql` (created)
  - Remote-applied patches to RPCs to use `extensions` search_path.

## Gotchas / safeguards
- Rate limiting: 10 lookups/hr, 5 verifies/hr; lockout after 3 failed verifications (30 min).
- No email enumeration; generic responses when account/question absent.
- Tokens expire in 15 minutes; previous tokens invalidated on issuance.
- Password reset via security question uses hashed tokens + bcrypt via pgcrypto.
