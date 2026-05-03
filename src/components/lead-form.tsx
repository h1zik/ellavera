"use client";

import { FormEvent, useState } from "react";

type FormState = {
  fullName: string;
  brandName: string;
  email: string;
  phone: string;
  message: string;
};

const initialState: FormState = {
  fullName: "",
  brandName: "",
  email: "",
  phone: "",
  message: "",
};

export function LeadForm() {
  const [state, setState] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [feedback, setFeedback] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setFeedback("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });

      if (!response.ok) {
        throw new Error("Gagal mengirim form.");
      }

      setState(initialState);
      setStatus("success");
      setFeedback("Terima kasih. Tim Ellavera akan segera menghubungi kamu.");
    } catch {
      setStatus("error");
      setFeedback("Terjadi kendala. Coba lagi atau hubungi WhatsApp kami.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <input
        className="retro-input"
        placeholder="Nama lengkap"
        value={state.fullName}
        onChange={(e) => setState((prev) => ({ ...prev, fullName: e.target.value }))}
        required
      />
      <input
        className="retro-input"
        placeholder="Nama brand (opsional)"
        value={state.brandName}
        onChange={(e) => setState((prev) => ({ ...prev, brandName: e.target.value }))}
      />
      <input
        className="retro-input"
        type="email"
        placeholder="Email aktif"
        value={state.email}
        onChange={(e) => setState((prev) => ({ ...prev, email: e.target.value }))}
        required
      />
      <input
        className="retro-input"
        placeholder="Nomor WhatsApp"
        value={state.phone}
        onChange={(e) => setState((prev) => ({ ...prev, phone: e.target.value }))}
      />
      <textarea
        className="retro-input min-h-[120px]"
        placeholder="Ceritakan idemu"
        value={state.message}
        onChange={(e) => setState((prev) => ({ ...prev, message: e.target.value }))}
        required
      />
      <button className="retro-button" disabled={status === "loading"}>
        {status === "loading" ? "Mengirim..." : "Kirim Brief"}
      </button>
      {feedback && (
        <p className={status === "success" ? "text-green-700" : "text-red-700"}>
          {feedback}
        </p>
      )}
    </form>
  );
}
