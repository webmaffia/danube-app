"use client";

// KYC, simulated: an Emirates ID or passport number with format validation,
// UAE PASS consent, date of birth, address, a liveness check and a verdict.
// Only a masked document number is kept in the session.

import { useEffect, useState } from "react";
import { useAppRouter as useRouter } from "@/lib/nav";
import { useSession } from "@/lib/store";
import { yearsSince } from "@/lib/journey";
import { Button, Card, Field, SandboxTag, ScreenTitle, Steps, StickyBar, inputClass } from "@/components/journey/ui";

type DocType = "eid" | "passport";
type Step = "id" | "consent" | "address" | "liveness" | "done";
const ORDER: Step[] = ["id", "consent", "address", "liveness", "done"];

const DOC_LABEL: Record<DocType, string> = { eid: "Emirates ID", passport: "Passport" };

// Emirates ID: 784-YYYY-NNNNNNN-C, 15 digits. Passport: 6 to 9 letters or digits.
const EID = /^784-\d{4}-\d{7}-\d$/;
const PASSPORT = /^[A-Z0-9]{6,9}$/;

/** Groups raw digits as 784-YYYY-NNNNNNN-C while the customer types. */
function formatEid(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 15);
  return [d.slice(0, 3), d.slice(3, 7), d.slice(7, 14), d.slice(14, 15)].filter(Boolean).join("-");
}

export default function Kyc() {
  const router = useRouter();
  const { profile, kyc, booking, setKyc, sendEvent } = useSession();
  const [step, setStep] = useState<Step>(kyc ? "done" : "id");
  const [docType, setDocType] = useState<DocType>("eid");
  const [docNo, setDocNo] = useState("");
  const [name, setName] = useState(profile.name ?? "");
  const [dob, setDob] = useState("");
  const [consent, setConsent] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [line, setLine] = useState("");
  const [country, setCountry] = useState("");
  const [scan, setScan] = useState(0);

  const docOk = docType === "eid" ? EID.test(docNo) : PASSPORT.test(docNo);
  const age = yearsSince(dob);
  const dobOk = age !== null && age >= 18 && age < 100;

  // Liveness: a short scripted scan, then the verdict.
  useEffect(() => {
    if (step !== "liveness") return;
    const timers = [1, 2, 3].map((i) => setTimeout(() => setScan(i), i * 1000));
    timers.push(
      setTimeout(() => {
        const masked = docType === "eid" ? `784-••••-•••••••-${docNo.slice(-1)}` : `${docNo.slice(0, 2)}•••${docNo.slice(-2)}`;
        setKyc({ idMasked: masked, name: name.trim(), verifiedAt: Date.now() });
        setStep("done");
        void sendEvent(
          "KYC verified",
          `The customer completed KYC${booking ? ` for booking ${booking.booking_id}` : ""}: ${DOC_LABEL[docType]} format valid, UAE PASS consent, address and liveness all verified (simulated).`,
          "kyc_completed",
        );
      }, 3600),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const idx = ORDER.indexOf(step);

  // KYC follows the token payment: send the customer back to pay first.
  if (booking?.status !== "paid" && !kyc) {
    return (
      <div className="d-narrow flex min-h-full flex-col">
        <ScreenTitle eyebrow="Verify your identity" title="Pay the token first" sub="KYC opens once your token payment is done." />
        <StickyBar>
          <Button onClick={() => router.push("/booking")}>Go to booking</Button>
        </StickyBar>
      </div>
    );
  }

  return (
    <div className="d-narrow flex min-h-full flex-col">
      <ScreenTitle eyebrow="Verify your identity" title={step === "done" ? "KYC complete" : "Quick KYC"} sub="Takes about two minutes." right={<SandboxTag />} />
      <Steps current={idx + 1} total={ORDER.length} />

      {step === "id" && (
        <form
          className="mt-5 flex flex-1 flex-col gap-4 px-4 desk:px-0"
          onSubmit={(e) => {
            e.preventDefault();
            if (docOk && dobOk && name.trim().length > 1) setStep("consent");
          }}
        >
          <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Identity document">
            {(Object.keys(DOC_LABEL) as DocType[]).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={docType === t}
                onClick={() => {
                  setDocType(t);
                  setDocNo("");
                }}
                className={`rounded-xl border px-3 py-2.5 text-[13.5px] font-semibold ${docType === t ? "border-gold bg-gold/10 text-ink" : "border-line bg-card text-ink-soft"}`}
              >
                {DOC_LABEL[t]}
              </button>
            ))}
          </div>
          <Field
            label={`${DOC_LABEL[docType]} number`}
            error={docType === "eid" ? (docNo.length === 18 && !docOk ? "An Emirates ID looks like 784-1990-1234567-1." : null) : docNo.length >= 6 && !docOk ? "A passport number is 6 to 9 letters or digits." : null}
            hint={docType === "eid" ? "15 digits, starting 784." : "As printed on your passport."}
          >
            <input
              value={docNo}
              onChange={(e) => setDocNo(docType === "eid" ? formatEid(e.target.value) : e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9))}
              placeholder={docType === "eid" ? "784-1990-1234567-1" : "A1234567"}
              inputMode={docType === "eid" ? "numeric" : "text"}
              autoCapitalize="characters"
              className={`${inputClass} font-semibold tracking-[0.12em]`}
            />
          </Field>
          <Field label={`Name as on ${DOC_LABEL[docType].toLowerCase()}`}>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="name" />
          </Field>
          <Field label="Date of birth" error={dob && !dobOk ? "You need to be 18 or older." : null}>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputClass} />
          </Field>
          <StickyBar className="-mx-4 desk:mx-0">
            <Button type="submit" disabled={!docOk || !dobOk || name.trim().length < 2}>
              Continue
            </Button>
          </StickyBar>
        </form>
      )}

      {step === "consent" && (
        <div className="mt-5 flex flex-1 flex-col px-4 desk:px-0">
          <Card className="px-4 py-4">
            <div className="font-display text-[24px] font-semibold tracking-tight">Verify with UAE PASS</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              We confirm your name and photo with your consent. Your full document number is never stored: only a masked version is kept.
            </p>
            <label className="mt-3 flex items-start gap-2.5 text-[13px] leading-snug">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--gold)]" />
              I consent to Danube verifying my identity details through UAE PASS for this booking.
            </label>
          </Card>
          <StickyBar className="-mx-4 desk:mx-0">
            <Button
              disabled={!consent || fetching}
              onClick={() => {
                setFetching(true);
                setTimeout(() => {
                  setFetching(false);
                  setStep("address");
                }, 1500);
              }}
            >
              {fetching ? "Connecting to UAE PASS…" : "Continue with UAE PASS · simulated"}
            </Button>
          </StickyBar>
        </div>
      )}

      {step === "address" && (
        <form
          className="mt-5 flex flex-1 flex-col gap-4 px-4 desk:px-0"
          onSubmit={(e) => {
            e.preventDefault();
            if (line.trim().length > 4 && country.trim().length > 1) setStep("liveness");
          }}
        >
          <p className="rounded-xl border border-gold/25 bg-gold-soft px-3.5 py-2.5 text-[12.5px] text-gold">Identity details received. Confirm your current address.</p>
          <Field label="Address">
            <input value={line} onChange={(e) => setLine(e.target.value)} placeholder="Apartment, building, street" className={inputClass} autoComplete="street-address" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <input defaultValue={profile.city ?? ""} className={inputClass} autoComplete="address-level2" />
            </Field>
            <Field label="Country">
              <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} autoComplete="country-name" />
            </Field>
          </div>
          <StickyBar className="-mx-4 desk:mx-0">
            <Button type="submit" disabled={line.trim().length < 5 || country.trim().length < 2}>
              Continue to selfie check
            </Button>
          </StickyBar>
        </form>
      )}

      {step === "liveness" && (
        <div className="mt-6 flex flex-col items-center px-4 desk:px-0 text-center">
          <div className="relative flex h-52 w-44 items-center justify-center overflow-hidden rounded-[48%] border-[3px] border-gold bg-site shadow-[0_0_50px_-10px_rgba(201,176,142,0.5)]">
            <svg viewBox="0 0 100 120" className="h-40 text-site-ink/50" aria-hidden="true">
              <ellipse cx="50" cy="52" rx="28" ry="34" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M20 118 C24 92 38 86 50 86 C62 86 76 92 80 118" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
            <div className="absolute inset-x-0 h-1 bg-gold shadow-[0_0_16px_4px_rgba(189,165,136,0.6)]" style={{ top: `${15 + (scan % 2) * 70}%`, transition: "top 1s ease-in-out" }} />
          </div>
          <p className="mt-4 text-[15px] font-semibold">{["Hold your phone at eye level", "Blink twice", "Turn slightly left", "Checking…"][scan]}</p>
          <p className="text-[12px] text-ink-soft">Simulated liveness check. The camera isn&rsquo;t used.</p>
        </div>
      )}

      {step === "done" && (
        <div className="mt-5 flex flex-1 flex-col px-4 desk:px-0">
          <Card className="divide-y divide-line">
            {[
              [DOC_LABEL[docType], kyc?.idMasked ?? "Verified"],
              ["Name match", kyc?.name ?? name],
              ["UAE PASS", "Consent received"],
              ["Address", "Confirmed"],
              ["Liveness", "Passed"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-4 py-2.5 text-[13.5px]">
                <span className="text-ink-soft">{k}</span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className="text-gold">✓</span>
                  {v}
                </span>
              </div>
            ))}
          </Card>
          <p className="mt-3 text-center text-[11.5px] text-ink-soft">Sandbox verdict. No identity documents were checked.</p>
          <StickyBar className="-mx-4 desk:mx-0">
            <Button onClick={() => router.push("/booking/plan")}>Continue to payment schedule</Button>
          </StickyBar>
        </div>
      )}
    </div>
  );
}
