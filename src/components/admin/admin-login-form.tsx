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
        setError(data.error ?? "Gagal masuk");
        return;
      }
      router.replace(redirectAfterLogin);
      router.refresh();
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
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm font-black text-black/80">
        Password
        <input
          className="retro-input mt-1"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
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
