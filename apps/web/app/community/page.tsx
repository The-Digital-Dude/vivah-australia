import Image from 'next/image';
import { PublicHeader, PublicFooter, PremiumButton } from '@/app/components';
import { FAQAccordion } from '@/app/components/premium-design-system';
import {
  Users,
  MapPin,
  Heart,
  ShieldCheck,
  Star,
  Globe,
  ArrowRight,
  Sparkles,
  MessageCircle,
  CheckCircle,
} from 'lucide-react';

export const metadata = {
  title: 'Community | Vivah Australia',
  description:
    'Vivah Australia brings together singles from every Indian state, language, and cultural background. Find someone who shares your roots, language, and family values.',
};

const COMMUNITIES = [
  {
    name: 'Punjabi',
    members: '2,500+',
    badge: 'Most Active',
    traits: ['North Indian traditions', 'Sikh & Hindu families', 'Vibrant culture'],
    color: 'bg-amber-50 border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  {
    name: 'Gujarati',
    members: '1,800+',
    badge: 'Fastest Growing',
    traits: ['Business-minded families', 'Vegetarian values', 'Strong diaspora'],
    color: 'bg-orange-50 border-orange-200',
    badgeColor: 'bg-orange-100 text-orange-800',
  },
  {
    name: 'Tamil',
    members: '1,200+',
    badge: '',
    traits: ['South Indian heritage', 'Professional focus', 'Family-first values'],
    color: 'bg-rose-50 border-rose-200',
    badgeColor: '',
  },
  {
    name: 'Telugu',
    members: '1,500+',
    badge: '',
    traits: ['Andhra & Telangana roots', 'IT & finance community', 'Strong culture'],
    color: 'bg-red-50 border-red-200',
    badgeColor: '',
  },
  {
    name: 'Malayali',
    members: '1,100+',
    badge: '',
    traits: ['Kerala heritage', 'Healthcare & education', 'Close-knit community'],
    color: 'bg-green-50 border-green-200',
    badgeColor: '',
  },
  {
    name: 'Marathi',
    members: '900+',
    badge: '',
    traits: ['Maharashtra roots', 'Rich traditions', 'Progressive families'],
    color: 'bg-indigo-50 border-indigo-200',
    badgeColor: '',
  },
  {
    name: 'Bengali',
    members: '800+',
    badge: '',
    traits: ['West Bengal & Bangladesh', 'Arts & academia', 'Deep cultural pride'],
    color: 'bg-blue-50 border-blue-200',
    badgeColor: '',
  },
  {
    name: 'Kannada',
    members: '600+',
    badge: '',
    traits: ['Karnataka heritage', 'Tech & innovation', 'Traditional values'],
    color: 'bg-teal-50 border-teal-200',
    badgeColor: '',
  },
  {
    name: 'Rajasthani',
    members: '450+',
    badge: '',
    traits: ['Vibrant traditions', 'Entrepreneurial spirit', 'Desert heritage'],
    color: 'bg-yellow-50 border-yellow-200',
    badgeColor: '',
  },
  {
    name: 'Sindhi',
    members: '380+',
    badge: '',
    traits: ['Business community', 'Resilient heritage', 'Global diaspora'],
    color: 'bg-purple-50 border-purple-200',
    badgeColor: '',
  },
  {
    name: 'Muslim',
    members: '700+',
    badge: '',
    traits: ['Halal lifestyle', 'Islamic values', 'Nationwide network'],
    color: 'bg-emerald-50 border-emerald-200',
    badgeColor: '',
  },
  {
    name: 'Others',
    members: '1,000+',
    badge: '',
    traits: ['Bihari, Odia, Assamese', 'All traditions welcome', 'Growing every week'],
    color: 'bg-slate-50 border-slate-200',
    badgeColor: '',
  },
];

const AUSTRALIA_CITIES = [
  { city: 'Sydney', state: 'NSW', members: '3,800+', top: '18%', left: '87%' },
  { city: 'Melbourne', state: 'VIC', members: '3,200+', top: '74%', left: '78%' },
  { city: 'Brisbane', state: 'QLD', members: '1,400+', top: '30%', left: '83%' },
  { city: 'Perth', state: 'WA', members: '900+', top: '55%', left: '15%' },
  { city: 'Adelaide', state: 'SA', members: '500+', top: '68%', left: '62%' },
  { city: 'Canberra', state: 'ACT', members: '320+', top: '62%', left: '80%' },
];

const VALUES = [
  {
    icon: Globe,
    title: 'Language Preferences',
    body: 'Search and connect with members who speak your mother tongue — from Hindi and Tamil to Telugu and Bengali.',
  },
  {
    icon: Heart,
    title: 'Regional Traditions',
    body: 'We understand that a Gujarati family celebration looks different from a Kerala wedding. Your traditions matter here.',
  },
  {
    icon: ShieldCheck,
    title: 'Religious Values',
    body: 'Whether Hindu, Sikh, Muslim, Jain, or Christian — filter by faith and find someone aligned with your beliefs.',
  },
  {
    icon: Users,
    title: 'Family Customs',
    body: "Vivah is built for families who care deeply about who their children marry. We respect the role family plays in the decision.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I was specifically looking for a Punjabi girl in Melbourne who understood what it meant to grow up in a diaspora family. Vivah actually understood that. We got married in November.",
    name: 'Harpreet S.',
    community: 'Punjabi Community · Melbourne',
    image: '/home/success-stories/couple-02.jpg',
  },
  {
    quote:
      "As a Gujarati family, we had very specific expectations. The filtering on Vivah was the only platform that respected that without making it feel weird. We found our daughter-in-law in six weeks.",
    name: 'Ramesh P.',
    community: 'Gujarati Community · Sydney',
    image: '/home/success-stories/couple-07.jpg',
  },
  {
    quote:
      'I am Tamil, she is Telugu — two South Indian families who found common ground through Vivah. Our parents were thrilled. The verification gave everyone confidence.',
    name: 'Karthik R.',
    community: 'Tamil–Telugu · Brisbane',
    image: '/home/success-stories/couple-11.jpg',
  },
];

const FAQ_ITEMS = [
  {
    id: 'filter-community',
    question: 'Can I filter matches by community or language?',
    answer:
      'Yes. Vivah Australia lets you filter profiles by language, religion, region of origin, and cultural background. Free members get basic filters; paid plans unlock the full advanced filter set.',
  },
  {
    id: 'all-communities',
    question: 'Do you support communities outside the main list?',
    answer:
      'Absolutely. While we feature the largest communities, members from every Indian state and background are welcome. The "Others" category includes Bihari, Odia, Assamese, and many more communities.',
  },
  {
    id: 'inter-community',
    question: 'What if I am open to meeting someone from a different community?',
    answer:
      'Many of our members are open to inter-community matches. You can set your preferences to include other communities while still filtering for the values and family expectations that matter most to you.',
  },
  {
    id: 'verified',
    question: 'Are community profiles verified?',
    answer:
      'All Vivah members go through identity verification. Community information is self-declared, and our team flags any profiles that appear inconsistent with verification documents.',
  },
  {
    id: 'events',
    question: 'Does Vivah host community events in Australia?',
    answer:
      'We are building a community events calendar for 2026. Events will include curated in-person meets in Sydney, Melbourne, and Brisbane. Members will be notified by email when events go live.',
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative bg-brand-maroon pt-24 pb-36 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-5">
            20+ Communities · All of Australia
          </p>
          <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            One Platform.{' '}
            <span className="text-brand-gold">Every Community.</span>
          </h1>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            Vivah Australia brings together singles from every Indian state, language, and cultural
            background — with the filters and values that actually matter to your family.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PremiumButton href="/register" variant="gold">
              Join Your Community
              <ArrowRight className="size-4" />
            </PremiumButton>
            <PremiumButton href="/search" variant="secondary">
              Browse Profiles
            </PremiumButton>
          </div>

          {/* Quick trust indicators */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {[
              { icon: ShieldCheck, label: '10,000+ verified members' },
              { icon: MapPin, label: 'All 8 Australian states' },
              { icon: Star, label: '500+ success stories' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
              >
                <Icon className="size-3.5 text-brand-gold" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
          </svg>
        </div>
      </section>

      {/* ── Stats Strip ───────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: '10,000+', label: 'Active Members' },
              { value: '20+', label: 'Communities' },
              { value: '8', label: 'States & Territories' },
              { value: '500+', label: 'Weddings Celebrated' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-playfair text-3xl sm:text-4xl font-bold text-brand-maroon">{value}</p>
                <p className="mt-1 text-sm font-semibold text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community Grid ────────────────────────────────────────────── */}
      <section className="py-24 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-14">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">
              Browse by Background
            </p>
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-brand-charcoal mb-4">
              Find Your Community
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-base leading-relaxed">
              We respect the diversity of Indian culture. Connect with members who understand your
              language, traditions, and family expectations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {COMMUNITIES.map((community) => (
              <div
                key={community.name}
                className={`relative rounded-[24px] border p-6 transition hover:-translate-y-1 hover:shadow-lg ${community.color}`}
              >
                {community.badge && (
                  <span className={`absolute top-4 right-4 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${community.badgeColor}`}>
                    {community.badge}
                  </span>
                )}
                <div className="mb-4">
                  <p className="font-playfair text-xl font-bold text-brand-charcoal mb-1">
                    {community.name}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-maroon">
                    {community.members} members
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {community.traits.map((trait) => (
                    <li key={trait} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="size-3.5 shrink-0 text-brand-gold" />
                      {trait}
                    </li>
                  ))}
                </ul>
                <a
                  href={`/search?community=${community.name.toLowerCase()}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-maroon hover:underline"
                >
                  Browse profiles
                  <ArrowRight className="size-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Members Across Australia ───────────────────────────────────── */}
      <section className="bg-brand-maroon py-24 px-6 sm:px-8 lg:px-12 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,160,76,0.1),transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="text-center mb-14">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-3">
              Nationwide Network
            </p>
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-white mb-4">
              Members Across Australia
            </h2>
            <p className="text-white/60 max-w-xl mx-auto text-base leading-relaxed">
              From Sydney to Perth, Vivah has a growing community of Indian singles in every major
              Australian city.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Map */}
            <div className="relative">
              <div className="relative aspect-[4/3] w-full max-w-lg mx-auto">
                <Image
                  src="/home/australia-dotted-map.png"
                  alt="Indian singles community across Australia"
                  fill
                  className="object-contain opacity-60"
                  sizes="(max-width: 768px) 100vw, 512px"
                />
              </div>
            </div>

            {/* City list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AUSTRALIA_CITIES.map(({ city, state, members }) => (
                <div
                  key={city}
                  className="rounded-[18px] border border-white/15 bg-white/8 p-5 backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-playfair text-lg font-bold text-white">{city}</p>
                    <span className="text-xs font-bold text-brand-gold/80 uppercase tracking-widest">{state}</span>
                  </div>
                  <p className="text-sm font-semibold text-brand-gold">{members} members</p>
                  <div className="mt-2 h-1 rounded-full bg-white/10">
                    <div
                      className="h-1 rounded-full bg-brand-gold/60"
                      style={{
                        width:
                          city === 'Sydney' ? '100%' :
                          city === 'Melbourne' ? '84%' :
                          city === 'Brisbane' ? '37%' :
                          city === 'Perth' ? '24%' :
                          city === 'Adelaide' ? '13%' : '8%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Community Values ──────────────────────────────────────────── */}
      <section className="bg-white py-24 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">
              Built With Respect
            </p>
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-brand-charcoal mb-4">
              We Celebrate Every Tradition
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-base leading-relaxed">
              Vivah Australia was built by the diaspora, for the diaspora. We understand nuance that
              generic dating apps miss entirely.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[24px] border border-gray-100 bg-brand-ivory p-7 flex flex-col gap-4"
              >
                <div className="size-12 rounded-2xl bg-brand-maroon/10 flex items-center justify-center">
                  <Icon className="size-5 text-brand-maroon" />
                </div>
                <div>
                  <p className="font-bold text-brand-charcoal text-base mb-2">{title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="bg-brand-ivory py-24 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">
              Real Stories
            </p>
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-brand-charcoal">
              Love Across Every Community
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ quote, name, community, image }) => (
              <div
                key={name}
                className="rounded-[28px] bg-white border border-gray-100 overflow-hidden shadow-sm flex flex-col"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <Sparkles className="size-5 text-brand-gold mb-3" />
                  <p className="text-sm leading-relaxed text-gray-600 flex-1 italic">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <p className="text-sm font-bold text-brand-charcoal">{name}</p>
                    <p className="text-xs text-brand-maroon font-semibold mt-0.5">{community}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community Events Teaser ───────────────────────────────────── */}
      <section className="bg-white py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[32px] border border-brand-gold/25 bg-[linear-gradient(135deg,#FFF8EC,#FFF9F5)] p-10 sm:p-14 text-center">
            <div className="size-14 rounded-2xl bg-brand-gold/15 flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="size-7 text-brand-gold" />
            </div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">
              Coming Soon
            </p>
            <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-brand-charcoal mb-4">
              Community Events in Australia
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed mb-8">
              We are building a curated events calendar for 2026 — in-person community meets in
              Sydney, Melbourne, and Brisbane for Vivah members to connect offline in a safe,
              structured environment.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {['Sydney Meet · Q1 2026', 'Melbourne Event · Q2 2026', 'Brisbane Gathering · Q2 2026'].map((event) => (
                <span
                  key={event}
                  className="rounded-full border border-brand-maroon/20 bg-white px-4 py-2 text-sm font-semibold text-brand-maroon"
                >
                  {event}
                </span>
              ))}
            </div>
            <p className="mt-8 text-sm text-gray-400">
              Registered members will be notified by email when events are announced.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="bg-brand-ivory py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="font-playfair text-3xl font-bold text-brand-charcoal">
              Common Questions
            </h2>
          </div>
          <FAQAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="relative bg-brand-maroon py-24 px-6 sm:px-8 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.18),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.2),transparent_55%)]" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-5">
            Your Community Is Waiting
          </p>
          <h2 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5">
            Find Someone Who Shares{' '}
            <span className="text-brand-gold">Your Roots</span>
          </h2>
          <p className="text-white/70 text-base sm:text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Join 10,000+ verified Indian singles across Australia who are looking for meaningful,
            family-approved relationships.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PremiumButton href="/register" variant="gold" className="min-w-[200px]">
              Create Free Profile
              <ArrowRight className="size-4" />
            </PremiumButton>
            <PremiumButton href="/success-stories" variant="secondary" className="min-w-[180px]">
              Read Success Stories
            </PremiumButton>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-sm mx-auto">
            {[
              { value: '10k+', label: 'Members' },
              { value: '20+', label: 'Communities' },
              { value: '500+', label: 'Weddings' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-playfair text-2xl font-bold text-brand-gold">{value}</p>
                <p className="text-xs font-semibold text-white/60 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
