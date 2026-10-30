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
  /** Baris yang detailnya (placeholder, min. karakter, id) sedang dibuka. */
  const [openRows, setOpenRows] = useState<Set<string>>(() => new Set());

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


  function toggleOpen(key: string) {
    setOpenRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const parseDetail = leadFormFieldsJsonIssuesSummary(JSON.stringify(fields));

  return (
    <div className="space-y-3">
      {parseDetail ? (
        <p role="alert" className="rounded-lg border-2 border-amber-600 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
          Belum bisa disimpan: {parseDetail}
        </p>
      ) : null}

      <ol className="space-y-2">
        {fields.map((field, index) => {
          const key = rowKeys[index] ?? `row-fallback-${index}`;
          const open = openRows.has(key);
          return (
            <li key={key} className="set-field" data-open={open}>
              <div className="set-field-main">
                <span className="set-field-num" aria-hidden>
                  {index + 1}
                </span>
                <input
                  className="retro-input py-2 text-sm font-semibold"
                  aria-label={`Pertanyaan ${index + 1}: label`}
                  value={field.label}
                  onChange={(e) => updateAt(index, { label: e.target.value })}
                />
                <select
                  className="retro-input py-2 text-sm"
                  aria-label={`Pertanyaan ${index + 1}: tipe jawaban`}
                  value={field.type}
                  onChange={(e) => updateAt(index, { type: e.target.value as LeadFieldType })}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <label className="admin-switch text-xs font-bold text-black/70">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateAt(index, { required: e.target.checked })}
                  />
                  <span className="admin-switch-track" aria-hidden />
                  Wajib
                </label>
                <div className="flex items-center gap-1 justify-self-end">
                  <button
                    type="button"
                    className="admin-icon-btn"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Naikkan pertanyaan ${index + 1}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn"
                    onClick={() => move(index, 1)}
                    disabled={index === fields.length - 1}
                    aria-label={`Turunkan pertanyaan ${index + 1}`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn w-auto px-2 text-xs"
                    onClick={() => toggleOpen(key)}
                    aria-expanded={open}
                  >
                    {open ? "Tutup" : "Detail"}
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn admin-icon-btn--danger"
                    onClick={() => removeAt(index)}
                    disabled={fields.length <= 1}
                    aria-label={`Hapus pertanyaan ${index + 1}`}
                    title="Hapus"
                  >
                    ×
                  </button>
                </div>
              </div>
              {open ? (
                <div className="grid gap-3 border-t border-dashed border-black/15 p-3 sm:grid-cols-[minmax(0,1fr)_8rem_16rem]">
                  <label className="set-mini-label">
                    Contoh isian (placeholder)
                    <input
                      className="retro-input mt-1 py-2 text-sm"
                      value={field.placeholder ?? ""}
                      onChange={(e) => updateAt(index, { placeholder: e.target.value || undefined })}
                    />
                  </label>
                  {field.type === "text" || field.type === "textarea" ? (
                    <label className="set-mini-label">
                      Min. karakter
                      <input
                        type="number"
                        min={1}
                        className="retro-input mt-1 py-2 text-sm"
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
                    <span className="hidden sm:block" />
                  )}
                  <label className="set-mini-label">
                    ID teknis
                    <input
                      className="retro-input mt-1 py-2 font-mono text-xs"
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
                    <span className="mt-1 block font-normal text-black/50">
                      Kolom di tabel Leads. Jangan diubah kalau sudah ada lead masuk.
                    </span>
                  </label>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button type="button" className="retro-button-alt px-4 py-2 text-xs" onClick={addField}>
          Tambah pertanyaan
        </button>
        <button
          type="button"
          className="text-xs font-bold text-black/55 underline underline-offset-2 hover:text-black"
          onClick={resetDefault}
        >
          Kembalikan ke pertanyaan bawaan
        </button>
      </div>
    </div>
  );
}
