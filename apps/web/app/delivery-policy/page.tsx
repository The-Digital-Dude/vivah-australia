import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/app/components';
import { Zap, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Digital Delivery & Fulfillment Policy | Vivah Australia',
  description:
    'Understand how digital memberships and services are delivered and fulfilled immediately upon payment on Vivah Australia.',
};

export default function DeliveryPolicyPage() {
  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      {/* Hero */}
      <section className="relative bg-brand-maroon pt-24 pb-36 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 sm:px-8 lg:px-12 text-center">
          <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-5">
            <Zap className="size-5 text-brand-gold" />
          </div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-4">
            Service Fulfillment
          </p>
          <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-white mb-4">
            Digital Delivery &amp; Fulfillment Policy
          </h1>
          <p className="text-white/70 text-sm">Last updated: November 2026</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
          </svg>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[28px] bg-white border border-gray-100 shadow-sm p-8 sm:p-12">
            <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-8 space-y-8">
              
              <div>
                <h2 className="font-bold text-xl text-brand-charcoal mb-2">1. Digital Service Nature</h2>
                <p>
                  Vivah Australia (<strong className="font-semibold text-brand-charcoal">ABN: 85 700 086 808</strong>) operates an online matchmaking and matrimony platform tailored for the Australian Indian community.
                </p>
                <p className="mt-3">
                  All products sold through our website — including Essential, Silver, Gold, and Platinum membership subscriptions, profile visibility boosts, and contact credits — are <strong className="font-semibold text-brand-charcoal">100% digital online services</strong>.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-xl text-brand-charcoal mb-2">2. Immediate Delivery &amp; Fulfillment Timeframe</h2>
                <p>
                  Because our services are digital, delivery is instantaneous upon successful payment authorization:
                </p>
                <ul className="mt-3 list-disc pl-5 space-y-2">
                  <li>
                    <strong className="font-semibold text-brand-charcoal">Instant Account Activation:</strong> Premium membership privileges (direct messaging, priority discovery, badge verification, and search filters) are unlocked in your account immediately upon payment approval (typically within seconds, up to 5 minutes).
                  </li>
                  <li>
                    <strong className="font-semibold text-brand-charcoal">Electronic Confirmation &amp; Tax Invoice:</strong> An electronic confirmation receipt and tax invoice outlining your purchased plan, duration, and billing details is automatically dispatched to your registered account email address within minutes of payment.
                  </li>
                  <li>
                    <strong className="font-semibold text-brand-charcoal">Digital Access 24/7:</strong> Once activated, you may access your purchased features at any time from any compatible device by logging into your account at <a href="https://www.vivahaustralia.com.au" className="text-brand-maroon underline font-medium">www.vivahaustralia.com.au</a>.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-bold text-xl text-brand-charcoal mb-2">3. No Physical Shipping Required</h2>
                <p>
                  As an entirely digital service provider:
                </p>
                <ul className="mt-3 list-disc pl-5 space-y-2">
                  <li>No physical parcels, documents, or items are dispatched by post or courier.</li>
                  <li>There are zero physical shipping, handling, postal, or customs fees.</li>
                  <li>Members are not required to provide a delivery shipping address for physical delivery, as all services are delivered over secure electronic telecommunications.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-bold text-xl text-brand-charcoal mb-2">4. Geographical Availability</h2>
                <p>
                  Our digital platform services are available across all Australian States and Territories:
                </p>
                <ul className="mt-3 list-disc pl-5 space-y-2">
                  <li>Victoria (VIC)</li>
                  <li>New South Wales (NSW)</li>
                  <li>Queensland (QLD)</li>
                  <li>Western Australia (WA)</li>
                  <li>South Australia (SA)</li>
                  <li>Tasmania (TAS)</li>
                  <li>Australian Capital Territory (ACT)</li>
                  <li>Northern Territory (NT)</li>
                </ul>
                <p className="mt-3">
                  International users may also access the platform electronically to connect with eligible Indian singles living in or relocating to Australia.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-xl text-brand-charcoal mb-2">5. Delivery Issues &amp; Customer Support</h2>
                <p>
                  If you have completed payment but your account does not reflect your upgraded membership features within 15 minutes:
                </p>
                <ol className="mt-3 list-decimal pl-5 space-y-2">
                  <li>Log out of your account, clear your browser cache, and log back in.</li>
                  <li>Verify that your bank has approved the transaction.</li>
                  <li>
                    If the issue persists, contact our Australian support team immediately with your registered email and transaction reference. We will manually provision your digital access or resolve the gateway communication without delay.
                  </li>
                </ol>
              </div>

              <div>
                <h2 className="font-bold text-xl text-brand-charcoal mb-2">6. Cardholder Statement &amp; Currency Disclosure</h2>
                <p>
                  Transactions processed on this website will appear on your credit/debit card or banking statement as <strong className="font-semibold text-brand-maroon">&quot;VIVAH AUSTRALIA&quot;</strong>.
                </p>
                <p className="mt-2">
                  All membership prices are quoted and charged in <strong className="font-semibold text-brand-charcoal">Australian Dollars (AUD)</strong> and are inclusive of Australian Goods and Services Tax (GST) where applicable.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-xl text-brand-charcoal mb-2">7. Merchant Contact Information</h2>
                <p>
                  For any questions concerning digital delivery, membership access, or billing fulfillment, please contact our merchant team:
                </p>
                <div className="mt-4 rounded-xl bg-brand-ivory/60 border border-brand-maroon/10 p-5 space-y-2 text-sm">
                  <p className="font-bold text-brand-charcoal">Vivah Australia</p>
                  <p><strong className="text-gray-700">ABN:</strong> 85 700 086 808</p>
                  <p><strong className="text-gray-700">Registered Trading Address:</strong> 3 Leafton Street, Truganina, VIC 3029, Australia</p>
                  <p><strong className="text-gray-700">Support Phone:</strong> <a href="tel:+61479134385" className="text-brand-maroon underline font-medium">+61 479 134 385</a> (Mon–Fri 9am–5pm AEST)</p>
                  <p><strong className="text-gray-700">Support Email:</strong> <a href="mailto:support@vivahaustralia.com.au" className="text-brand-maroon underline font-medium">support@vivahaustralia.com.au</a></p>
                  <p><strong className="text-gray-700">Website:</strong> <a href="https://www.vivahaustralia.com.au" target="_blank" rel="noopener noreferrer" className="text-brand-maroon underline font-medium">www.vivahaustralia.com.au</a></p>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-8 rounded-[20px] border border-brand-gold/25 bg-[linear-gradient(135deg,#FFF8EC,#FFF9F5)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-brand-charcoal text-sm">Questions about your digital order?</p>
              <p className="text-xs text-gray-500 mt-0.5">Our Melbourne-based team is here to assist with all billing and access queries.</p>
            </div>
            <Link href="/contact" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-maroon hover:underline shrink-0">
              Contact Support <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Related Policy Links */}
          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Related Policies</p>
            <div className="flex flex-wrap gap-2">
              {[
                ['Terms of Use', '/terms'],
                ['Refund Policy', '/refund-policy'],
                ['Privacy Policy', '/privacy'],
                ['Membership Options', '/pricing'],
                ['Contact Us', '/contact'],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href!}
                  className="rounded-full border border-brand-maroon/20 bg-white px-4 py-2 text-sm font-semibold text-brand-maroon hover:bg-brand-maroon hover:text-white transition"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
