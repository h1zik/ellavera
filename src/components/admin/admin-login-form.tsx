"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  redirectAfterLogin: string;
};

export function AdminLoginForm({ redirectAfterLogin }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Username atau password salah. Cek lagi lalu coba masuk.");
        return;
      }
      router.replace(redirectAfterLogin);
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Cek koneksi lalu coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {error ? (
        <p
          role="alert"
          className="rounded-xl border-2 border-red-600 bg-white px-3 py-2 text-sm font-bold text-red-800"
        >
          {error}
        </p>
      ) : null}
      <label className="block text-sm font-black text-black/80">
        Username
        <input
          className="retro-input mt-1"
          name="username"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm font-black text-black/80">
        Password
        <span className="mt-1 flex">
          <input
            className="retro-input rounded-r-none"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="retro-focus shrink-0 rounded-r-xl border-2 border-l-0 border-black/15 bg-white px-3 text-xs font-bold text-black/60 hover:text-black"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
          >
            {showPassword ? "Sembunyikan" : "Lihat"}
          </button>
        </span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="retro-button w-full py-3 text-base disabled:opacity-60"
      >
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
