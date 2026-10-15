"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { LeadFormField } from "@/lib/lead-form-config";
import { trackPixel } from "@/lib/meta-pixel";

function emptyState(fields: LeadFormField[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.id, ""]));
}

type Props = {
  fields: LeadFormField[];
};

export function LeadForm({ fields }: Props) {
  /** Hanya urutan + id field; jangan pakai `fields` di deps effect — parent mengirim array baru tiap render RSC sehingga effect akan reset form dan cabut fokus. */
  const fieldsKey = useMemo(() => fields.map((f) => f.id).join("|"), [fields]);
  const [state, setState] = useState<Record<string, string>>(() => emptyState(fields));
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setState(emptyState(fields));
    setStatus("idle");
    setFeedback("");
    // Hanya reset saat struktur field (urutan/id) berubah — bukan saat referensi `fields` baru dari parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldsKey]);

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

      setState(emptyState(fields));
      setStatus("success");
      setFeedback("Terima kasih. Tim Ellavera akan segera menghubungi kamu.");
      trackPixel("Lead");
    } catch {
      setStatus("error");
      setFeedback("Terjadi kendala. Coba lagi atau hubungi WhatsApp kami.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      {fields.map((field) => (
        <label key={field.id} className="block">
          <span className="retro-field-label">
            {field.label}
            {field.required ? null : (
              <span className="font-medium text-black/45"> (opsional)</span>
            )}
          </span>
          {renderControl(field)}
        </label>
      ))}
      <button
        type="submit"
        className="retro-button mt-1 disabled:opacity-60"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Mengirim…" : "Kirim brief"}
      </button>
      <div className="min-h-[3.25rem]" aria-live="polite">
        {feedback ? (
          <p
            role={status === "error" ? "alert" : undefined}
            className={[
              "rounded-xl border-2 px-3 py-2 text-sm font-semibold",
              status === "success"
                ? "border-green-700/40 bg-green-50 text-green-800"
                : "border-red-700/40 bg-red-50 text-red-800",
            ].join(" ")}
          >
            {feedback}
          </p>
        ) : null}
      </div>
    </form>
  );

  function renderControl(field: LeadFormField) {
    return field.type === "textarea" ? (
      <textarea
        name={field.id}
        className="retro-input min-h-[100px]"
        placeholder={field.placeholder || field.label}
        value={state[field.id] ?? ""}
        onChange={(e) =>
          setState((prev) => ({ ...prev, [field.id]: e.target.value }))
        }
        required={field.required}
        maxLength={field.maxLength}
        minLength={field.required ? field.minLength : undefined}
      />
        ) : (
      <input
        name={field.id}
        className="retro-input"
        type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
        placeholder={field.placeholder || field.label}
        value={state[field.id] ?? ""}
        onChange={(e) =>
          setState((prev) => ({ ...prev, [field.id]: e.target.value }))
        }
        required={field.required}
        maxLength={field.maxLength}
        minLength={field.required ? field.minLength : undefined}
        inputMode={field.type === "tel" ? "tel" : undefined}
        autoComplete={
          field.type === "email"
            ? "email"
            : field.id === "fullName"
              ? "name"
              : field.type === "tel"
                ? "tel"
                : "on"
        }
      />
        );
  }
}
