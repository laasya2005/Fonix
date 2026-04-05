"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

interface AuthGateProps {
  children: (user: User) => React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    const supabase = getSupabase();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Check your email for a confirmation link. Once confirmed, come back and log in.");
        setMode("login");
        setPassword("");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: 'var(--bg)' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Loading...</p>
      </div>
    );
  }

  if (user) {
    return <>{children(user)}</>;
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', background: 'var(--bg)', padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '22rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.35rem' }}>
            Fonix
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Train your American accent
          </p>
        </div>

        {success && (
          <div style={{
            padding: '0.75rem', borderRadius: '0.6rem', marginBottom: '0.75rem',
            background: 'var(--success-soft)', border: '1px solid rgba(16,185,129,0.15)',
          }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--success)', lineHeight: 1.5 }}>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%', padding: '0.75rem 0.85rem', borderRadius: '0.6rem',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', fontSize: '0.82rem', marginBottom: '0.5rem',
              outline: 'none',
            }}
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: '100%', padding: '0.75rem 0.85rem', borderRadius: '0.6rem',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', fontSize: '0.82rem', marginBottom: '0.75rem',
              outline: 'none',
            }}
          />

          {error && (
            <p style={{ fontSize: '0.7rem', color: 'var(--error)', marginBottom: '0.5rem' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '0.75rem', borderRadius: '0.6rem',
              border: '1px solid var(--text)', background: 'var(--text)', color: 'var(--bg)',
              fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          {mode === "login" ? "No account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}
            style={{
              background: 'none', border: 'none', color: 'var(--accent)',
              fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
