"use client";

import { useMemo } from "react";
import {
  BUTTON_EVENT_KINDS,
  BUTTON_EVENT_LABELS,
  CUSTOM_EVENT_NAME,
  TRACKABLE_BUTTONS,
  parseButtonEvents,
  resolveButtonEvent,
  serializeButtonEvents,
  type ButtonEventConfig,
  type ButtonEventKind,
} from "@/lib/button-events";
import { TRACKING_ID_PATTERNS } from "@/lib/tracking-ids";

type Props = {
  json: string | null | undefined;
  onChange: (json: string | null) => void;
};

/** Tabel tombol → event iklan. Disimpan sebagai JSON di SiteSettings.buttonEventsJson. */
export function ButtonEventsEditor({ json, onChange }: Props) {
  const map = useMemo(() => parseButtonEvents(json), [json]);

  function update(key: string, patch: Partial<ButtonEventConfig>) {
    const current = resolveButtonEvent(map, key);
    const next = { ...map, [key]: { ...current, ...patch } };
    onChange(serializeButtonEvents(next));
  }

  return (
    <ul className="divide-y divide-dashed divide-black/15">
      {TRACKABLE_BUTTONS.map((b) => {
        const c = resolveButtonEvent(map, b.key);
        const customBad = c.event === "custom" && !CUSTOM_EVENT_NAME.test(c.customName ?? "");
        const adsBad =
          Boolean(c.googleAdsSendTo) && !TRACKING_ID_PATTERNS.googleAdsSendTo.test(c.googleAdsSendTo!);
        return (
          <li
            key={b.key}
            className="grid gap-2 py-3 md:grid-cols-[minmax(0,1fr)_14rem_minmax(0,1fr)] md:items-start md:gap-3"
          >
            <div>
              <p className="text-sm font-bold">{b.label}</p>
              <p className="text-xs text-black/50">{b.where}</p>
            </div>
            <div className="space-y-2">
              <select
                className="retro-input py-2 text-sm"
                aria-label={`Event untuk ${b.label}`}
                value={c.event}
                onChange={(e) => update(b.key, { event: e.target.value as ButtonEventKind })}
              >
                {BUTTON_EVENT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {BUTTON_EVENT_LABELS[k]}
                  </option>
                ))}
              </select>
              {c.event === "custom" ? (
                <input
                  className="retro-input py-2 font-mono text-xs"
                  aria-label={`Nama event custom untuk ${b.label}`}
                  aria-invalid={customBad || undefined}
                  value={c.customName ?? ""}
                  onChange={(e) =>
                    update(b.key, {
                      customName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                    })
                  }
                  placeholder="klik_pricelist"
                  spellCheck={false}
                />
              ) : null}
            </div>
            {c.event !== "none" ? (
              <input
                className="retro-input py-2 font-mono text-xs"
                aria-label={`Label konversi Google Ads untuk ${b.label}`}
                aria-invalid={adsBad || undefined}
                value={c.googleAdsSendTo ?? ""}
                onChange={(e) => update(b.key, { googleAdsSendTo: e.target.value.trim() || undefined })}
                placeholder="Label Google Ads (opsional)"
                spellCheck={false}
              />
            ) : (
              <span className="hidden md:block" />
            )}
            {customBad || adsBad ? (
              <p className="text-xs font-bold text-red-700 md:col-span-3">
                {customBad ? "Nama event custom: huruf kecil, angka, atau _ (mis. klik_pricelist). " : ""}
                {adsBad ? "Label Google Ads harus berformat AW-123456789/AbCdEf." : ""}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
