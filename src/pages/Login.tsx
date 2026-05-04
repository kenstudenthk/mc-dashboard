/**
 * src/pages/Login.tsx — Full auth flow for Multi Cloud Order Dashboard.
 * Supabase integration complete; all screens wired.
 */

import React, { useState, useEffect } from 'react';
import {
  Eye, EyeOff, Mail, Lock, ArrowLeft,
  CheckCircle2, AlertCircle, RefreshCw, Send,
} from 'lucide-react';

// TODO [1]: ✓ Supabase client imported
import { supabase } from '../lib/supabase';
// TODO [2]: authService no longer needed directly in Login — supabase client used directly.

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen =
  | 'login'
  | 'change-password'
  | 'forgot-email'
  | 'check-inbox'
  | 'reset-password'
  | 'success'
  | 'loading'
  | 'access-denied';

export interface LoginProps {
  /** Called after successful sign-in / password change */
  onSuccess?: () => void;
  /** Starting screen. Defaults to 'login'. */
  initialScreen?: Screen;
  /** Pre-fill the first-time email (used when force_password_change is detected by PermissionContext) */
  initialEmail?: string;
}

// ─── Password rules ───────────────────────────────────────────────────────────

const PW_RULES = [
  { label: 'At least 8 characters',          test: (p: string) => p.length >= 8 },
  { label: 'At least one uppercase letter',   test: (p: string) => /[A-Z]/.test(p) },
  { label: 'At least one number',             test: (p: string) => /[0-9]/.test(p) },
  { label: 'At least one special character',  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

// ─── Shared UI primitives ─────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoFocus?: boolean;
  hint?: string;
}

function Field({ label, type = 'text', placeholder, value, onChange, error, autoFocus, hint }: FieldProps) {
  const [show, setShow] = useState(false);
  const isPass = type === 'password';
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <label className="text-[11px] font-semibold text-[#1d1d1f]/55 tracking-tight">{label}</label>
        {hint && <span className="text-[10px] text-[#1d1d1f]/35">{hint}</span>}
      </div>
      <div className="relative">
        <input
          autoFocus={autoFocus}
          type={isPass && show ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={[
            'w-full px-3.5 py-2.5 text-sm font-medium rounded-[10px] outline-none transition-all duration-150',
            'bg-[#f5f4f1] border text-[#1d1d1f] placeholder:text-[#1d1d1f]/30',
            'focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,113,227,0.12)]',
            error
              ? 'border-red-400 focus:border-red-400'
              : 'border-[#1d1d1f]/12 focus:border-[#0071e3]',
            isPass ? 'pr-10' : '',
          ].join(' ')}
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1d1d1f]/35 hover:text-[#1d1d1f]/60 transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <span className="text-[11px] text-red-500 font-medium flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </span>
      )}
    </div>
  );
}

function PrimaryBtn({
  children, loading, disabled, type = 'submit', onClick,
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
      className={[
        'w-full py-2.5 rounded-xl text-sm font-bold text-white',
        'flex items-center justify-center gap-2 transition-all duration-150',
        'shadow-[rgba(0,0,0,0.22)_0px_4px_12px]',
        loading || disabled
          ? 'bg-[#aaa] cursor-not-allowed'
          : 'bg-[#1d1d1f] hover:bg-[#333] hover:-translate-y-px hover:shadow-[rgba(0,0,0,0.28)_0px_6px_16px] cursor-pointer',
      ].join(' ')}
    >
      {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-[11px] transition-colors duration-200 ${met ? 'text-[#078a52] font-semibold' : 'text-[#1d1d1f]/40'}`}>
      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${met ? 'bg-[#078a52]' : 'bg-[#1d1d1f]/10'}`}>
        {met && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
      </span>
      {label}
    </div>
  );
}

function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-semibold text-[#0071e3] hover:underline mb-5 transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card w-full max-w-[380px] p-8 animate-[fadeUp_0.4s_cubic-bezier(0.34,1.4,0.64,1)_both]">
      {children}
    </div>
  );
}

// ─── Left panel ───────────────────────────────────────────────────────────────

// TODO [3]: Update these paths to wherever you store cloud provider logos in /public
const CLOUD_PROVIDERS = [
  { name: 'AWS',          src: '/cloud-providers/aws.svg'     },
  { name: 'Azure',        src: '/cloud-providers/azure.svg'   },
  { name: 'Google Cloud', src: '/cloud-providers/gcp.svg'     },
  { name: 'Huawei',       src: '/cloud-providers/huawei.svg'  },
  { name: 'Alibaba',      src: '/cloud-providers/ali.svg'     },
  { name: 'Tencent',      src: '/cloud-providers/tencent.svg' },
];

function LeftPanel() {
  return (
    <div className="hidden md:flex w-[420px] shrink-0 bg-gradient-to-br from-[#252528] to-[#1c1c1e] flex-col p-10 relative overflow-hidden">
      <div className="absolute w-72 h-72 rounded-full bg-[#0071e3]/20 blur-[60px] -top-16 -right-16 pointer-events-none" />
      <div className="absolute w-52 h-52 rounded-full bg-[#3bd3fd]/12 blur-[50px] bottom-20 -left-10 pointer-events-none" />
      <div className="absolute w-40 h-40 rounded-full bg-[#43089f]/18 blur-[45px] -bottom-10 right-16 pointer-events-none" />

      {/* Logo */}
      <div className="flex items-center gap-3 relative">
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <svg width="36" height="36" viewBox="0 0 42 42" fill="none">
            <path d="M7 29 L7 13 L14 24 L21 13 L21 29" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M38 17 C36 12 29 11 26 16 C23 21 25 29 30 30 C33 31 36 29 38 26" stroke="rgba(59,211,253,0.90)" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="font-bold text-sm text-white tracking-tight">Multi Cloud</span>
      </div>

      {/* Hero copy */}
      <div className="flex-1 flex flex-col justify-center relative gap-2.5">
        <p className="label-text text-white/35 mb-1">Order Dashboard</p>
        <h1 className="text-[38px] font-black tracking-[-0.04em] text-white leading-[1.05]">
          Provision.<br />Track.<br />Manage.
        </h1>
        <p className="text-sm text-white/45 leading-relaxed max-w-[300px] mt-1.5">
          Internal operations tool for multi-cloud account provisioning across all major cloud providers.
        </p>
        <div className="flex flex-wrap gap-2.5 mt-6 items-center">
          {CLOUD_PROVIDERS.map(p => (
            <img key={p.name} src={p.src} alt={p.name} title={p.name}
              className="w-9 h-9 object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ))}
        </div>
      </div>

      <p className="text-[10px] text-white/20 relative">Internal use only — authorised personnel only.</p>
    </div>
  );
}

// ─── Screen 1: Sign In ────────────────────────────────────────────────────────

function SignInScreen({ onSuccess, onForgot, onFirstTime }: {
  onSuccess: () => void;
  onForgot: () => void;
  onFirstTime: (email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!email) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    try {
      // TODO [4]: ✓ Supabase sign-in wired
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrors({ password: error.message });
        return;
      }
      if (data.user?.user_metadata?.force_password_change) {
        onFirstTime(email);
      } else {
        onSuccess();
      }
    } catch {
      setErrors({ password: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-[#1d1d1f] leading-tight">Sign in</h2>
        <p className="text-xs text-[#1d1d1f]/45 mt-1.5">Enter your credentials to access the dashboard.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
        <Field label="Email" type="email" placeholder="you@company.com"
          value={email} onChange={v => { setEmail(v); setErrors(e => ({ ...e, email: '' })); }}
          error={errors.email} autoFocus />
        <Field label="Password" type="password" placeholder="••••••••"
          value={password} onChange={v => { setPassword(v); setErrors(e => ({ ...e, password: '' })); }}
          error={errors.password} />

        <div className="flex items-center justify-between mt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span onClick={() => setRemember(r => !r)}
              className={`w-4 h-4 rounded-[4px] flex items-center justify-center border-[1.5px] transition-all duration-150 cursor-pointer shrink-0 ${remember ? 'bg-[#0071e3] border-[#0071e3]' : 'border-[#1d1d1f]/20 bg-transparent'}`}>
              {remember && (
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="text-xs text-[#1d1d1f]/55 font-medium">Remember me</span>
          </label>
          <button type="button" onClick={onForgot}
            className="text-xs font-semibold text-[#0071e3] hover:underline transition-colors">
            Forgot password?
          </button>
        </div>

        <div className="mt-2"><PrimaryBtn loading={loading}>Sign In</PrimaryBtn></div>
      </form>
      <p className="text-center text-[11px] text-[#1d1d1f]/35 mt-5 leading-relaxed">
        Having trouble? Contact your administrator<br />or the IT helpdesk for access.
      </p>
    </AuthCard>
  );
}

// ─── Screen 2: First-time Login — Change Password ─────────────────────────────

function ChangePasswordScreen({ email, onDone }: { email: string; onDone: () => void }) {
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const ruleResults = PW_RULES.map(r => ({ ...r, met: r.test(next) }));
  const allRulesMet = ruleResults.every(r => r.met);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!next) e.next = 'Enter a new password.';
    else if (!allRulesMet) e.next = 'Password does not meet all requirements.';
    if (!confirm) e.confirm = 'Please confirm your new password.';
    else if (next !== confirm) e.confirm = 'Passwords do not match.';
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);

    try {
      // TODO [5]: ✓ Update password via Supabase and clear force_password_change
      // User is already signed in (signInWithPassword succeeded on the previous screen).
      const { error: pwError } = await supabase.auth.updateUser({ password: next });
      if (pwError) { setErrors({ next: pwError.message }); return; }
      await supabase.auth.updateUser({ data: { force_password_change: false } });
      onDone();
    } catch {
      setErrors({ next: 'Failed to update password. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fef9c3] border border-[#f8cc65] mb-4">
        <AlertCircle className="w-3 h-3 text-[#a16207]" />
        <span className="text-[11px] font-bold text-[#a16207] tracking-tight">First-time login</span>
      </div>
      <h2 className="text-[22px] font-extrabold text-[#1d1d1f] leading-tight mb-1.5">Set your password</h2>
      <p className="text-xs text-[#1d1d1f]/45 mb-5 leading-relaxed">
        You're setting up your account for the first time.<br />Please set a new password to continue.
      </p>
      <div className="flex items-center gap-2 px-3 py-2 bg-[#f5f4f1] rounded-[9px] border border-[#1d1d1f]/08 mb-5">
        <Mail className="w-3.5 h-3.5 text-[#1d1d1f]/40 shrink-0" />
        <span className="text-xs text-[#1d1d1f]/55 font-mono truncate">{email || 'user@company.com'}</span>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
        <Field label="New password" type="password" placeholder="Create a strong password"
          value={next} onChange={v => { setNext(v); setErrors(e => ({ ...e, next: '' })); }}
          error={errors.next} autoFocus />
        {next.length > 0 && (
          <div className="flex flex-col gap-1.5 px-3 py-2.5 bg-[#f9f8f6] rounded-[9px] border border-[#1d1d1f]/07">
            {ruleResults.map((r, i) => <PasswordRule key={i} met={r.met} label={r.label} />)}
          </div>
        )}
        <Field label="Confirm new password" type="password" placeholder="Re-enter your new password"
          value={confirm} onChange={v => { setConfirm(v); setErrors(e => ({ ...e, confirm: '' })); }}
          error={errors.confirm} />
        <div className="mt-2">
          <PrimaryBtn loading={loading} disabled={next.length > 0 && !allRulesMet}>Set New Password</PrimaryBtn>
        </div>
      </form>
    </AuthCard>
  );
}

// ─── Screen 3: Forgot Password — Enter Email ──────────────────────────────────

function ForgotEmailScreen({ onBack, onSent }: { onBack: () => void; onSent: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!email) { setError('Email is required.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address.'); return; }
    setError('');
    setLoading(true);

    try {
      // TODO [6]: ✓ Send reset email via Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?screen=reset-password`,
      });
      if (error) { setError(error.message); return; }
      onSent(email);
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <BackLink label="Back to sign in" onClick={onBack} />
      <div className="w-11 h-11 rounded-xl bg-[#dbeafe] flex items-center justify-center mb-4">
        <Mail className="w-5 h-5 text-[#0071e3]" />
      </div>
      <h2 className="text-[22px] font-extrabold text-[#1d1d1f] leading-tight mb-1.5">Forgot password?</h2>
      <p className="text-xs text-[#1d1d1f]/45 mb-6 leading-relaxed">
        Enter your work email and we'll send you a link to reset your password.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Work email" type="email" placeholder="you@company.com"
          value={email} onChange={v => { setEmail(v); setError(''); }}
          error={error} autoFocus />
        <PrimaryBtn loading={loading}>
          <Send className="w-3.5 h-3.5" />
          Send Reset Link
        </PrimaryBtn>
      </form>
    </AuthCard>
  );
}

// ─── Screen 4: Check Inbox ────────────────────────────────────────────────────

function CheckInboxScreen({ email, onBack, onOpenLink }: {
  email: string;
  onBack: () => void;
  onOpenLink: () => void;
}) {
  const [resent, setResent] = useState(false);

  async function handleResend() {
    setResent(true);
    // TODO [7]: ✓ Resend via Supabase
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?screen=reset-password`,
    });
    setTimeout(() => setResent(false), 3000);
  }

  return (
    <div className="w-full max-w-[380px] animate-[fadeUp_0.4s_cubic-bezier(0.34,1.4,0.64,1)_both]">
      <div className="card p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0071e3] to-[#3bd3fd] flex items-center justify-center mx-auto mb-5 shadow-[rgba(0,113,227,0.40)_0_8px_24px]">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-[22px] font-extrabold text-[#1d1d1f] mb-2">Check your inbox</h2>
        <p className="text-xs text-[#1d1d1f]/50 mb-1.5 leading-relaxed">We sent a password reset link to</p>
        <p className="text-sm font-bold text-[#0071e3] mb-6 font-mono break-all">{email}</p>
        <div className="bg-[#f9f8f6] rounded-[10px] p-3.5 border border-[#1d1d1f]/07 text-left mb-6 flex flex-col gap-2">
          {['Open the email from MC Dashboard', 'Click the "Reset Password" link', 'The link expires in 30 minutes'].map((step, i) => (
            <div key={i} className="flex gap-2.5 text-xs text-[#1d1d1f]/60 leading-snug">
              <span className="w-[18px] h-[18px] rounded-full bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">{i + 1}</span>
              {step}
            </div>
          ))}
        </div>
        {/* NOTE: In production this button is not needed — the user clicks the link in their email.
            Supabase sends them back to redirectTo URL with a session token in the URL hash.
            You can remove this button and instead detect the token on mount:
            supabase.auth.onAuthStateChange((event) => {
              if (event === 'PASSWORD_RECOVERY') navigate('/login?screen=reset-password')
            }) */}
        <button onClick={onOpenLink}
          className="gradient-cta w-full py-2.5 text-sm font-bold mb-3 shadow-[rgba(0,0,0,0.18)_0_4px_10px]">
          Open Reset Link ↗
        </button>
        <div className="flex items-center justify-center gap-2.5">
          <button onClick={handleResend}
            className={`text-xs font-semibold transition-colors ${resent ? 'text-[#078a52]' : 'text-[#0071e3] hover:underline'}`}>
            {resent ? '✓ Email resent' : 'Resend email'}
          </button>
          <span className="text-[#1d1d1f]/20 text-xs">·</span>
          <button onClick={onBack} className="text-xs font-semibold text-[#1d1d1f]/45 hover:underline">
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 5: Reset Password ─────────────────────────────────────────────────

function ResetPasswordScreen({ onDone }: { onDone: () => void }) {
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const ruleResults = PW_RULES.map(r => ({ ...r, met: r.test(next) }));
  const allRulesMet = ruleResults.every(r => r.met);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!next) e.next = 'Enter a new password.';
    else if (!allRulesMet) e.next = 'Password does not meet all requirements.';
    if (!confirm) e.confirm = 'Please confirm your password.';
    else if (next !== confirm) e.confirm = 'Passwords do not match.';
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);

    try {
      // TODO [8]: ✓ Update password — user is already authenticated via the reset email link.
      // Supabase auto-exchanges the token in the URL hash when this page loads.
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) { setErrors({ next: error.message }); return; }
      onDone();
    } catch {
      setErrors({ next: 'Failed to reset password. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] flex items-center justify-center mb-4">
        <Lock className="w-5 h-5 text-[#7e22ce]" />
      </div>
      <h2 className="text-[22px] font-extrabold text-[#1d1d1f] leading-tight mb-1.5">Reset password</h2>
      <p className="text-xs text-[#1d1d1f]/45 mb-6 leading-relaxed">Create a strong new password for your account.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
        <Field label="New password" type="password" placeholder="Create a strong password"
          value={next} onChange={v => { setNext(v); setErrors(e => ({ ...e, next: '' })); }}
          error={errors.next} autoFocus />
        {next.length > 0 && (
          <div className="flex flex-col gap-1.5 px-3 py-2.5 bg-[#f9f8f6] rounded-[9px] border border-[#1d1d1f]/07">
            {ruleResults.map((r, i) => <PasswordRule key={i} met={r.met} label={r.label} />)}
          </div>
        )}
        <Field label="Confirm new password" type="password" placeholder="Re-enter your password"
          value={confirm} onChange={v => { setConfirm(v); setErrors(e => ({ ...e, confirm: '' })); }}
          error={errors.confirm} />
        <div className="mt-2">
          <PrimaryBtn loading={loading} disabled={next.length > 0 && !allRulesMet}>Reset Password</PrimaryBtn>
        </div>
      </form>
    </AuthCard>
  );
}

// ─── Screen 6: Success ────────────────────────────────────────────────────────

function SuccessScreen({ message = 'Redirecting you to the dashboard…' }: { message?: string }) {
  return (
    <div className="w-full max-w-[360px] text-center animate-[fadeUp_0.4s_cubic-bezier(0.34,1.4,0.64,1)]">
      <div className="w-16 h-16 rounded-full mx-auto mb-5 bg-gradient-to-br from-[#078a52] to-[#84e7a5] flex items-center justify-center shadow-[rgba(7,138,82,0.45)_0_8px_24px]">
        <CheckCircle2 className="w-7 h-7 text-white" />
      </div>
      <h2 className="text-[26px] font-extrabold text-[#1d1d1f] mb-2">All done!</h2>
      <p className="text-sm text-[#1d1d1f]/50 mb-7 leading-relaxed">{message}</p>
      <div className="flex items-center justify-center gap-2">
        <RefreshCw className="w-3.5 h-3.5 text-[#1d1d1f]/30 animate-spin" />
        <span className="text-xs text-[#1d1d1f]/35 font-medium">Loading dashboard…</span>
      </div>
    </div>
  );
}

// ─── Screen: Loading ──────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="w-full max-w-[360px] text-center">
      <div className="w-14 h-14 rounded-full mx-auto mb-5 bg-gradient-to-br from-[#0071e3] to-[#3bd3fd] flex items-center justify-center shadow-[rgba(0,113,227,0.35)_0_8px_24px]">
        <RefreshCw className="w-6 h-6 text-white animate-spin" />
      </div>
      <h2 className="text-xl font-extrabold text-[#1d1d1f] mb-2">Loading…</h2>
      <p className="text-sm text-[#1d1d1f]/40">Verifying your access credentials.</p>
    </div>
  );
}

// ─── Screen: Access Denied ────────────────────────────────────────────────────

function AccessDeniedScreen() {
  // TODO [9]: ✓ Supabase sign-out wired
  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="w-full max-w-[380px] animate-[fadeUp_0.4s_cubic-bezier(0.34,1.4,0.64,1)_both]">
      <div className="card p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-[22px] font-extrabold text-[#1d1d1f] mb-2">Access not granted</h2>
        <p className="text-xs text-[#1d1d1f]/50 mb-1.5 leading-relaxed">
          Your account has not been added to this system.
        </p>
        <p className="text-xs text-[#1d1d1f]/35 mb-7 leading-relaxed">
          Please contact your administrator to request access.
        </p>
        <button onClick={handleSignOut}
          className="gradient-cta w-full py-2.5 text-sm font-bold shadow-[rgba(0,0,0,0.18)_0_4px_10px]">
          Sign out
        </button>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Login({ onSuccess, initialScreen = 'login', initialEmail = '' }: LoginProps) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [firstTimeEmail, setFirstTimeEmail] = useState(initialEmail);
  const [forgotEmail, setForgotEmail] = useState('');

  useEffect(() => {
    setScreen(initialScreen);
  }, [initialScreen]);

  useEffect(() => {
    if (initialEmail) setFirstTimeEmail(initialEmail);
  }, [initialEmail]);

  // Handle Supabase auth redirects — switches to reset-password when the user
  // follows the password-reset email link back to this page.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setScreen('reset-password');
    });
    return () => subscription.unsubscribe();
  }, []);

  function handleSuccess() {
    setScreen('success');
    if (onSuccess) setTimeout(onSuccess, 1800);
  }

  function renderScreen() {
    switch (screen) {
      case 'loading':       return <LoadingScreen />;
      case 'access-denied': return <AccessDeniedScreen />;
      case 'login':
        return (
          <SignInScreen
            onSuccess={handleSuccess}
            onForgot={() => setScreen('forgot-email')}
            onFirstTime={em => { setFirstTimeEmail(em); setScreen('change-password'); }}
          />
        );
      case 'change-password':
        return <ChangePasswordScreen email={firstTimeEmail} onDone={handleSuccess} />;
      case 'forgot-email':
        return (
          <ForgotEmailScreen
            onBack={() => setScreen('login')}
            onSent={em => { setForgotEmail(em); setScreen('check-inbox'); }}
          />
        );
      case 'check-inbox':
        return (
          <CheckInboxScreen
            email={forgotEmail}
            onBack={() => setScreen('login')}
            onOpenLink={() => setScreen('reset-password')}
          />
        );
      case 'reset-password': return <ResetPasswordScreen onDone={handleSuccess} />;
      case 'success':        return <SuccessScreen />;
      default:               return null;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <LeftPanel />
      <div key={screen} className="flex-1 flex items-center justify-center px-10 py-16 overflow-y-auto bg-[#faf9f7]">
        {renderScreen()}
      </div>
    </div>
  );
}
