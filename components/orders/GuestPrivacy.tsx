"use client";

import { useEffect, useRef, useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";
import type { GuestSessionDTO } from "@salasty-thrift-closet/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cartStore } from "@/contexts/cartStore";
import { errorMessage } from "@/lib/api";
import { acceptGuestSession, GUEST_CHANGED_EVENT, guestApi } from "@/lib/guest-api";
import { confirm } from "@/components/ui/ConfirmDialog";
import { formatDateTime } from "@/lib/time";

export function GuestPrivacy({ onChanged }: { onChanged: () => void }) {
  const [token, setToken] = useState("");
  const [recovery, setRecovery] = useState<{ token: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const visit = useRef(0);

  useEffect(() => {
    const clear = () => {
      visit.current += 1;
      setRecovery(null);
      setToken("");
      setMessage(null);
      setError(null);
    };
    window.addEventListener(GUEST_CHANGED_EVENT, clear);
    return () => window.removeEventListener(GUEST_CHANGED_EVENT, clear);
  }, []);

  async function action(kind: "save" | "recover" | "reset") {
    if (kind === "reset" && !(await confirm({ title: "Clear your cart and orders from this browser?", description: "You won't be able to get them back here without a backup code. Orders you've already sent to the store are not cancelled.", confirmLabel: "Clear", tone: "danger" }))) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    const currentVisit = visit.current;
    try {
      if (kind === "save") {
        const code = await guestApi.post<{ token: string; expiresAt: string }>("/customer/recovery-token");
        if (visit.current === currentVisit) {
          setRecovery(code);
          setCopied(false);
        }
      } else {
        const next = await guestApi.post<GuestSessionDTO>(kind === "reset" ? "/customer/session/reset" : "/customer/recover", kind === "recover" ? { token: token.trim() } : undefined);
        acceptGuestSession(next);
        cartStore.notifySessionChanged();
        await cartStore.refresh();
        setToken("");
        setRecovery(null);
        setMessage(kind === "reset" ? "Done. Your cart and orders are cleared from this browser." : "Your cart and orders are back. That code has now been used, so get a new one if you move again.");
        onChanged();
      }
    } catch (cause) {
      if (visit.current === currentVisit) setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      <summary className="cursor-pointer font-semibold text-brand">Changing phones? Keep your cart and orders</summary>
      <div className="mt-5 space-y-5 text-sm">
        <p className="max-w-2xl leading-relaxed text-muted">You don&apos;t need an account to shop here, so your cart and orders are saved on this browser only. They won&apos;t appear on another phone or browser, and they&apos;ll disappear from here if you clear your browsing data.</p>
        <div>
          <h3 className="font-semibold text-ink">Moving to a new phone or browser?</h3>
          <p className="mb-3 mt-1 max-w-2xl leading-relaxed text-muted">Get a backup code here first. Then enter it on the new phone or browser to bring your cart and orders with you.</p>
          <Button variant="secondary" disabled={busy} onClick={() => void action("save")}>Get my backup code</Button>
          {recovery && <div className="mt-3 max-w-xl rounded-xl bg-brand-50 p-4">
            <p className="font-semibold text-ink">Your backup code</p>
            <p className="mb-2 mt-1">Copy it and save it somewhere safe, like your notes. Don&apos;t share it: anyone who has it can see your cart and orders.</p>
            <code className="block select-all break-all rounded-lg bg-white p-3 font-mono">{recovery.token}</code>
            <Button variant="secondary" size="sm" className="mt-2" leftIcon={copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />} onClick={() => { void navigator.clipboard?.writeText(recovery.token).then(() => setCopied(true), () => setCopied(false)); }}>{copied ? "Copied" : "Copy code"}</Button>
            <p className="mt-2 text-xs text-muted">You&apos;ll only see this code once. It works one time and expires {formatDateTime(recovery.expiresAt)}. Getting a new code cancels this one.</p>
          </div>}
        </div>
        <form className="max-w-xl space-y-3" onSubmit={(event) => { event.preventDefault(); void action("recover"); }}>
          <Input label="Have a backup code?" hint="Paste your code to move your cart and orders here. They'll no longer show on the old phone or browser, and anything on this browser now will be replaced. Order numbers and phone numbers won't work." value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" spellCheck={false} maxLength={43} />
          <Button type="submit" variant="secondary" disabled={busy || token.trim().length !== 43}>Bring back my cart and orders</Button>
        </form>
        <div className="border-t border-line pt-4">
          <h3 className="font-semibold text-ink">Using a shared phone or computer?</h3>
          <p className="mb-3 mt-1 max-w-2xl leading-relaxed text-muted">Clear your cart and orders from this browser so the next person can&apos;t see them.</p>
          <Button variant="secondary" disabled={busy} onClick={() => void action("reset")}>Clear my cart and orders here</Button>
        </div>
        {message && <p role="status" className="text-brand">{message}</p>}
        {error && <p role="alert" className="text-danger">{error}</p>}
      </div>
    </details>
  );
}
