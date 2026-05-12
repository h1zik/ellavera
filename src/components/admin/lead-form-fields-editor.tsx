"use client";

import { useEffect, useRef, useState } from "react";
import type { LeadFieldType, LeadFormField } from "@/lib/lead-form-config";
import {
  DEFAULT_LEAD_FORM_FIELDS_JSON,
  leadFormFieldsJsonIssuesSummary,
  safeParseLeadFormFieldsJson,
} from "@/lib/lead-form-config";

type Props = {
  json: string | null;
  onChange: (nextJson: string) => void;
};

function newFieldId(): string {
  return `f_${Math.random().toString(36).slice(2, 10)}`;
}

function newRowKeys(count: number): string[] {
  return Array.from({ length: count }, () => crypto.randomUUID());
}

function fieldsFromProp(json: string | null): LeadFormField[] {
  const r = safeParseLeadFormFieldsJson(json);
  if (r.success) {
    return r.data;
  }
  return JSON.parse(DEFAULT_LEAD_FORM_FIELDS_JSON) as LeadFormField[];
}

const TYPE_OPTIONS: { value: LeadFieldType; label: string }[] = [
  { value: "text", label: "Teks pendek" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Telepon / WA" },
  { value: "textarea", label: "Teks panjang" },
];

export function LeadFormFieldsEditor({ json, onChange }: Props) {
  const initialFields = fieldsFromProp(json);
  /** Sinkron dari props hanya jika `json` benar-benar beda dari terakhir kita kirim — hindari reset `rowKeys` tiap ketik (remount = fokus hilang). */
  const lastSyncedJsonRef = useRef<string>((json ?? "").trim());

  const [fields, setFields] = useState<LeadFormField[]>(initialFields);
  /** Key stabil per baris — jangan pakai `field.id` di React key supaya fokus input tidak loncat saat mengedit id. */
  const [rowKeys, setRowKeys] = useState<string[]>(() => newRowKeys(initialFields.length));

  useEffect(() => {
    const trimmed = (json ?? "").trim();
    if (trimmed === lastSyncedJsonRef.current) return;
    const r = safeParseLeadFormFieldsJson(json);
    if (!r.success) return;
    lastSyncedJsonRef.current = trimmed;
    setFields(r.data);
    setRowKeys(newRowKeys(r.data.length));
  }, [json]);

  function emit(next: LeadFormField[]) {
    const serialized = JSON.stringify(next);
    setFields(next);
    lastSyncedJsonRef.current = serialized.trim();
    onChange(serialized);
  }

  function updateAt(index: number, patch: Partial<LeadFormField>) {
    const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    emit(next);
  }

  function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[index], next[j]] = [next[j]!, next[index]!];
    setRowKeys((prev) => {
      const rk = [...prev];
      [rk[index], rk[j]] = [rk[j]!, rk[index]!];
      return rk;
    });
    emit(next);
  }

  function removeAt(index: number) {
    if (fields.length <= 1) return;
    const next = fields.filter((_, i) => i !== index);
    setRowKeys((prev) => prev.filter((_, i) => i !== index));
    emit(next);
  }

  function addField() {
    const row: LeadFormField = {
      id: newFieldId(),
      label: "Field baru",
      type: "text",
      required: false,
      placeholder: "",
    };
    const next = [...fields, row];
    setRowKeys((prev) => [...prev, crypto.randomUUID()]);
    emit(next);
  }

  function resetDefault() {
    const d = JSON.parse(DEFAULT_LEAD_FORM_FIELDS_JSON) as LeadFormField[];
    setRowKeys(newRowKeys(d.length));
    emit(d);
  }

  const parseDetail = leadFormFieldsJsonIssuesSummary(JSON.stringify(fields));

  return (
    <div className="md:col-span-2 space-y-3 rounded-xl border-2 border-black/10 bg-white/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold">Form leads (halaman kontak)</p>
          <p className="text-xs font-semibold text-black/55">
            Urutan field = urutan di form publik. Untuk disimpan: tepat satu field bertipe email
            (wajib isi), id unik. Anda boleh sementara melanggar aturan saat mengedit; simpan
            pengaturan hanya jika sudah valid.
          </p>
          <div className="min-h-[2.75rem]">
            {parseDetail ? (
              <p className="mt-2 text-xs font-bold text-amber-800">
                Belum bisa disimpan: {parseDetail}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="retro-button-alt px-3 py-1.5 text-xs font-black" onClick={addField}>
            + Field
          </button>
          <button type="button" className="retro-button-alt px-3 py-1.5 text-xs font-black" onClick={resetDefault}>
            Reset default
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={rowKeys[index] ?? `row-fallback-${index}`}
            className="grid gap-2 rounded-lg border-2 border-black/10 bg-white/80 p-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end"
          >
            <label className="text-xs font-bold lg:col-span-2">
              Id (kunci)
              <input
                className="retro-input mt-1 font-mono text-xs"
                value={field.id}
                onChange={(e) => {
                  let v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                  if (v.length > 0 && !/^[a-z]/.test(v)) {
                    v = `f_${v.replace(/^_+/, "")}`;
                  }
                  updateAt(index, { id: v });
                }}
                spellCheck={false}
                placeholder="nama_field"
              />
              <span className="mt-1 block text-[10px] font-semibold text-black/45">
                Huruf kecil di awal, lalu huruf/angka/_ — contoh: email, budget_2025. Jangan dikosongkan.
              </span>
            </label>
            <label className="text-xs font-bold lg:col-span-2">
              Label
              <input
                className="retro-input mt-1"
                value={field.label}
                onChange={(e) => updateAt(index, { label: e.target.value })}
              />
            </label>
            <label className="text-xs font-bold lg:col-span-2">
              Tipe
              <select
                className="retro-input mt-1"
                value={field.type}
                onChange={(e) => updateAt(index, { type: e.target.value as LeadFieldType })}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs font-bold lg:col-span-2">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateAt(index, { required: e.target.checked })}
                className="h-4 w-4 accent-[var(--brand-primary)]"
              />
              Wajib isi
            </label>
            <label className="text-xs font-bold lg:col-span-3">
              Placeholder
              <input
                className="retro-input mt-1"
                value={field.placeholder ?? ""}
                onChange={(e) => updateAt(index, { placeholder: e.target.value || undefined })}
              />
            </label>
            {field.type === "text" || field.type === "textarea" ? (
              <label className="text-xs font-bold lg:col-span-1">
                Min len
                <input
                  type="number"
                  min={1}
                  className="retro-input mt-1"
                  value={field.minLength ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateAt(index, {
                      minLength: v === "" ? undefined : Math.max(1, Number.parseInt(v, 10) || 1),
                    });
                  }}
                />
              </label>
            ) : (
              <span className="hidden lg:col-span-1" />
            )}
            <div className="flex flex-wrap gap-1 lg:col-span-12 lg:justify-end">
              <button
                type="button"
                className="retro-button-alt px-2 py-1 text-[10px] font-black"
                onClick={() => move(index, -1)}
                disabled={index === 0}
              >
                ↑
              </button>
              <button
                type="button"
                className="retro-button-alt px-2 py-1 text-[10px] font-black"
                onClick={() => move(index, 1)}
                disabled={index === fields.length - 1}
              >
                ↓
              </button>
              <button
                type="button"
                className="retro-button-alt px-2 py-1 text-[10px] font-black text-red-700"
                onClick={() => removeAt(index)}
                disabled={fields.length <= 1}
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
