'use client';

import Script from 'next/script';
import { useEffect, useMemo, useState } from 'react';

type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const storageKey = 'vivah_cookie_consent_v1';

const defaultConsent: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function readConsent(): ConsentState | null {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<ConsentState>;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
    };
  } catch {
    return null;
  }
}

function saveConsent(consent: ConsentState) {
  window.localStorage.setItem(storageKey, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent('vivah-cookie-consent', { detail: consent }));
}

export default function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [draft, setDraft] = useState<ConsentState>(defaultConsent);

  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      setConsent(stored);
      setDraft(stored);
      return;
    }
    setShowBanner(true);
  }, []);

  const consentScripts = useMemo(() => {
    if (!consent) return null;

    return (
      <>
        {consent.analytics && ga4Id ? (
          <>
            <Script
              id="vivah-ga4-src"
              src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
              strategy="afterInteractive"
            />
            <Script id="vivah-ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4Id}', { anonymize_ip: true });
              `}
            </Script>
          </>
        ) : null}
        {consent.marketing && metaPixelId ? (
          <Script id="vivah-meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        ) : null}
      </>
    );
  }, [consent, ga4Id, metaPixelId]);

  function commit(next: ConsentState) {
    saveConsent(next);
    setConsent(next);
    setDraft(next);
    setShowBanner(false);
  }

  return (
    <>
      {consentScripts}
      {showBanner ? (
        <section
          aria-label="Cookie consent"
          className="fixed inset-x-4 bottom-4 z-[300] mx-auto max-w-4xl rounded-2xl border border-[#A10E4D]/15 bg-white p-4 text-[#2F2F2F] shadow-[0_18px_60px_rgba(47,47,47,0.22)] sm:p-5"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="text-base font-bold">Privacy choices</h2>
              <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                We use necessary storage to keep the site working. Analytics and marketing
                cookies only run when you allow them.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked disabled className="size-4 accent-[#A10E4D]" />
                  Necessary
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={draft.analytics}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, analytics: event.target.checked }))
                    }
                    className="size-4 accent-[#A10E4D]"
                  />
                  Analytics
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={draft.marketing}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, marketing: event.target.checked }))
                    }
                    className="size-4 accent-[#A10E4D]"
                  />
                  Marketing
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <button
                type="button"
                className="min-h-11 rounded-xl bg-[#A10E4D] px-5 text-sm font-bold text-white"
                onClick={() => commit({ necessary: true, analytics: true, marketing: true })}
              >
                Accept all
              </button>
              <button
                type="button"
                className="min-h-11 rounded-xl border border-[#A10E4D]/20 px-5 text-sm font-bold text-[#A10E4D]"
                onClick={() => commit(draft)}
              >
                Save choices
              </button>
              <button
                type="button"
                className="min-h-11 rounded-xl border border-neutral-200 px-5 text-sm font-bold text-[#2F2F2F]"
                onClick={() => commit(defaultConsent)}
              >
                Necessary only
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
