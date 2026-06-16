import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  Heart,
  Search,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  LockKeyhole,
  MapPin,
  UserCheck,
  Camera,
  FileText,
  Star,
} from 'lucide-react';
import { PublicHeader, PublicFooter } from '@/app/components';

export const metadata: Metadata = {
  title: 'How It Works | Vivah Australia',
  description:
    'Discover how Vivah Australia helps Indian singles in Australia find meaningful, verified connections in six simple steps.',
};

const steps = [
  {
    number: '01',
    icon: UserCheck,
    title: 'Create Your Profile',
    subtitle: 'Get started in minutes',
    description:
      'Register with your basic details — name, age, location, and what you\'re looking for. Your profile is the foundation of your journey. It only takes a few minutes to get started.',
    details: ['Free to register', 'Basic details only', 'No credit card required', 'Instant access to browse'],
    color: 'bg-brand-maroon',
  },
  {
    number: '02',
    icon: Camera,
    title: 'Complete Your Profile',
    subtitle: 'Tell your story',
    description:
      'Add your photos, family background, career details, lifestyle preferences, and partner expectations. A complete profile attracts 5× more meaningful connections.',
    details: ['Upload up to 10 photos', 'Family & cultural background', 'Career & education details', 'Partner preferences'],
    color: 'bg-[#8A0C41]',
  },
  {
    number: '03',
    icon: ShieldCheck,
    title: 'Get Verified',
    subtitle: 'Build trust instantly',
    description:
      'Vivah Australia manually reviews every profile. Add your verified badge by submitting identity documents. Verified members receive priority visibility and 3× more responses.',
    details: ['ID & licence verification', 'Employment verification', 'Visa status verification', 'Police check option'],
    color: 'bg-brand-gold',
    goldStep: true,
  },
  {
    number: '04',
    icon: Search,
    title: 'Discover Matches',
    subtitle: 'Find who you\'re looking for',
    description:
      'Browse curated profiles using our smart filters — by community, age, location, education, and lifestyle. Our compatibility algorithm surfaces your most compatible matches first.',
    details: ['Smart compatibility scoring', 'Advanced filter options', 'Location-based discovery', 'New profiles daily'],
    color: 'bg-brand-maroon',
  },
  {
    number: '05',
    icon: MessageCircle,
    title: 'Connect & Communicate',
    subtitle: 'Start meaningful conversations',
    description:
      'Express interest in profiles you like. When the interest is mutual, start a private, secure conversation. Premium members can message anyone directly — no waiting required.',
    details: ['Express interest feature', 'Mutual match messaging', 'Private photo sharing', 'Secure encrypted chat'],
    color: 'bg-[#8A0C41]',
  },
  {
    number: '06',
    icon: Heart,
    title: 'Meet & Build a Future',
    subtitle: 'The beginning of your story',
    description:
      'When you\'re both ready, take the connection offline. Vivah Australia has helped hundreds of Australian Indian families celebrate engagements and weddings across the country.',
    details: ['In-person meeting guidance', 'Family introduction support', 'Success story community', 'Ongoing matchmaking support'],
    color: 'bg-brand-gold',
    goldStep: true,
  },
];

const verificationTypes = [
  { icon: FileText, label: 'Driver Licence', desc: 'Government-issued photo ID verified by our team' },
  { icon: LockKeyhole, label: 'Employment', desc: 'Workplace confirmation and professional verification' },
  { icon: MapPin, label: 'Visa Status', desc: 'Residency and visa details confirmed for Australian members' },
  { icon: ShieldCheck, label: 'Police Check', desc: 'Optional police clearance for maximum trust' },
  { icon: Camera, label: 'Photo Review', desc: 'Every profile photo manually reviewed for authenticity' },
  { icon: Users, label: 'Manual Review', desc: 'Human review of every new profile before going live' },
];

const faqs = [
  {
    q: 'Is registration really free?',
    a: 'Yes. Creating and completing your profile, browsing members, and expressing interest are all free. Premium plans unlock unlimited messaging, advanced filters, and priority visibility.',
  },
  {
    q: 'How long does verification take?',
    a: 'Most verifications are completed within 24–48 hours. Our team reviews every submission manually to ensure accuracy. You\'ll receive an email notification once your verified badge is active.',
  },
  {
    q: 'Can I control who sees my profile?',
    a: 'Absolutely. You can set your profile to visible, hidden, or semi-private (blurred photos until you approve). Your contact details are never shared without your explicit consent.',
  },
  {
    q: 'What if I\'m searching for someone on behalf of my family?',
    a: 'Many families use Vivah Australia for their children or siblings. You can register with the candidate\'s details and manage the profile on their behalf — just indicate this during setup.',
  },
  {
    q: 'Which communities are on Vivah Australia?',
    a: 'We welcome all Indian and South Asian communities — Hindu, Muslim, Sikh, Christian, Jain, Buddhist, and more. Our platform respects your cultural values and preferences.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      <main>
        {/* HERO */}
        <section className="relative bg-brand-maroon pt-24 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.3),transparent_60%)]" />
          <div className="relative z-10 mx-auto max-w-5xl px-6 sm:px-8 lg:px-12 text-center">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-4">
              Your Journey Starts Here
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-playfair text-white leading-tight mb-6">
              How Vivah Australia Works
            </h1>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              From your first profile to your last introduction — here is everything you need to know about finding a meaningful, verified connection on Australia&apos;s most trusted Indian matrimonial platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded bg-brand-gold px-8 py-4 text-base font-bold text-brand-charcoal transition hover:bg-brand-gold/90"
              >
                Create Free Profile <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/matches"
                className="inline-flex items-center justify-center gap-2 rounded border border-white/30 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10"
              >
                Browse Members
              </Link>
            </div>
          </div>
          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
            </svg>
          </div>
        </section>

        {/* STEPS */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-brand-ivory">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">Simple & Transparent</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-brand-charcoal">
                Six Steps to Finding Your Match
              </h2>
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand-gold" />
                <div className="size-1.5 rotate-45 bg-brand-gold" />
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-brand-gold" />
              </div>
            </div>

            <div className="grid gap-8">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isEven = idx % 2 === 1;
                return (
                  <div
                    key={step.number}
                    className={`grid lg:grid-cols-2 gap-8 items-center ${isEven ? 'lg:[&>*:first-child]:order-2' : ''}`}
                  >
                    {/* Content */}
                    <div className={isEven ? 'lg:order-2' : ''}>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-5xl font-bold font-playfair text-brand-maroon/60 leading-none select-none">
                          {step.number}
                        </span>
                        <div
                          className={`size-12 rounded-2xl flex items-center justify-center ${step.goldStep ? 'bg-brand-gold' : 'bg-brand-maroon'}`}
                        >
                          <Icon className="size-6 text-white" strokeWidth={1.8} />
                        </div>
                      </div>
                      <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest mb-1 ${step.goldStep ? 'text-brand-gold' : 'text-brand-maroon'}`}>
                        {step.subtitle}
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-playfair font-bold text-brand-charcoal mb-4">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 text-base leading-relaxed mb-6">{step.description}</p>
                      <ul className="grid grid-cols-2 gap-3">
                        {step.details.map((d) => (
                          <li key={d} className="flex items-center gap-2.5 text-sm text-brand-charcoal font-medium">
                            <CheckCircle2 className={`size-4 shrink-0 ${step.goldStep ? 'text-brand-gold' : 'text-brand-maroon'}`} />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Visual Card */}
                    <div className={isEven ? 'lg:order-1' : ''}>
                      <div
                        className={`rounded-3xl p-8 sm:p-10 ${step.goldStep ? 'bg-brand-gold' : 'bg-brand-maroon'} relative overflow-hidden`}
                      >
                        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-12 translate-x-12" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
                        <div className="relative z-10 flex flex-col items-center text-center gap-6">
                          <div className="size-20 rounded-full bg-white/15 flex items-center justify-center">
                            <Icon className="size-10 text-white" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-1">Step {step.number}</p>
                            <h4 className="text-white text-2xl font-playfair font-bold">{step.title}</h4>
                          </div>
                          <div className="w-full grid grid-cols-2 gap-3">
                            {step.details.map((d) => (
                              <div key={d} className="bg-white/10 rounded-xl px-3 py-2.5 text-white text-xs font-semibold text-center">
                                {d}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* VERIFICATION SECTION */}
        <section className="bg-brand-maroon py-20 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.12),transparent_55%)]" />
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-14">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-3">Trust & Safety</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-white mb-4">
                Our Verification Process
              </h2>
              <p className="text-white/60 text-base max-w-2xl mx-auto leading-relaxed">
                Every Vivah Australia member goes through a manual review. Verified members carry a trust badge that signals authenticity to potential matches.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {verificationTypes.map((v) => {
                const Icon = v.icon;
                return (
                  <div
                    key={v.label}
                    className="bg-white/8 border border-white/10 rounded-2xl p-6 flex gap-4 items-start backdrop-blur-sm hover:bg-white/12 transition"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                  >
                    <div className="shrink-0 size-11 rounded-xl border border-brand-gold/30 bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                      <Icon className="size-5" strokeWidth={1.8} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base mb-1">{v.label}</h4>
                      <p className="text-white/55 text-sm leading-relaxed">{v.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex justify-center">
              <Link
                href="/verification-policy"
                className="inline-flex items-center gap-2 border border-brand-gold/40 rounded-xl px-6 py-3 text-base font-bold text-brand-gold transition hover:bg-brand-gold/10"
              >
                Read Verification Policy <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* WHY VIVAH */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-brand-ivory">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">What Sets Us Apart</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-brand-charcoal">
                Built for Australian Indian Families
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Manually Verified',
                  desc: 'No bots, no fake profiles. Every account is reviewed by a human before going live.',
                },
                {
                  icon: Sparkles,
                  title: 'Smart Matching',
                  desc: 'Our compatibility engine considers values, lifestyle, location, and family expectations.',
                },
                {
                  icon: LockKeyhole,
                  title: 'Privacy First',
                  desc: "You control what's visible. Blur your photos, hide your profile, share privately.",
                },
                {
                  icon: Star,
                  title: 'Proven Results',
                  desc: 'Hundreds of engagements and marriages across Australia since launch.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col gap-4"
                  >
                    <div className="size-12 rounded-xl bg-brand-ivory border border-brand-maroon/10 flex items-center justify-center text-brand-maroon">
                      <Icon className="size-6" strokeWidth={1.8} />
                    </div>
                    <h3 className="font-bold text-brand-charcoal text-lg">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">Common Questions</p>
              <h2 className="text-3xl sm:text-4xl font-playfair font-bold text-brand-charcoal">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-brand-ivory rounded-2xl border border-gray-100 p-6 sm:p-7">
                  <h3 className="font-bold text-brand-charcoal text-base sm:text-lg mb-3">
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-base mb-4">Still have questions?</p>
              <Link
                href="/help"
                className="inline-flex items-center gap-2 text-brand-maroon font-bold text-base hover:underline"
              >
                Visit Help Center <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-brand-maroon py-20 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,160,76,0.12),transparent_60%)]" />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <Sparkles className="size-8 text-brand-gold mx-auto mb-5" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-white mb-5">
              Ready to Start Your Journey?
            </h2>
            <p className="text-white/65 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              Join thousands of Australian Indian singles and families who have found meaningful connections through Vivah Australia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded bg-brand-gold px-8 py-4 text-base font-bold text-brand-charcoal transition hover:bg-brand-gold/90"
              >
                Create Free Profile <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/matches"
                className="inline-flex items-center justify-center gap-2 rounded border border-white/30 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10"
              >
                Browse Members
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
