import { PublicHeader, PublicFooter } from '@/app/components';
import { Users, MapPin, Heart, Sparkles, ShieldCheck, LockKeyhole } from 'lucide-react';

export const metadata = {
  title: 'Community | Vivah Australia',
  description: 'Explore the diverse Indian communities on Vivah Australia.',
};

const communities = [
  { icon: Users, label: 'Punjabi', count: '2,500+ Members' },
  { icon: MapPin, label: 'Gujarati', count: '1,800+ Members' },
  { icon: Heart, label: 'Tamil', count: '1,200+ Members' },
  { icon: Sparkles, label: 'Telugu', count: '1,500+ Members' },
  { icon: ShieldCheck, label: 'Marathi', count: '900+ Members' },
  { icon: LockKeyhole, label: 'Bengali', count: '800+ Members' },
  { icon: Users, label: 'Malayali', count: '1,100+ Members' },
  { icon: MapPin, label: 'Kannada', count: '600+ Members' },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-brand-ivory flex flex-col font-poppins selection:bg-brand-gold/20 selection:text-brand-maroon">
      <div className="bg-brand-maroon">
        <PublicHeader />
      </div>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-20 overflow-hidden bg-brand-maroon">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_60%)]" />
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white font-playfair mb-6 drop-shadow-lg">
              One Platform. <br className="sm:hidden" />
              <span className="text-brand-gold">Every Community.</span>
            </h1>
            <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-8">
              Vivah Australia brings together singles from every Indian state, language, and cultural background. Find someone who shares your roots and values.
            </p>
          </div>
        </section>

        {/* COMMUNITIES GRID */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-playfair font-bold text-brand-charcoal mb-4">Browse by Community</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">We respect the diversity of Indian culture. Connect with members who understand your language, traditions, and family values.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {communities.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex flex-col items-center justify-center text-center p-8 sm:p-10 bg-white border border-gray-100 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] cursor-pointer hover:border-brand-gold/30 hover:-translate-y-1">
                    <div className="text-brand-gold mb-5">
                      <Icon className="size-10" strokeWidth={1.5} />
                    </div>
                    <p className="text-[17px] font-bold text-brand-charcoal mb-2">{item.label}</p>
                    <span className="text-xs font-semibold text-brand-maroon uppercase tracking-wider">{item.count}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-16 text-center">
              <button className="inline-flex items-center justify-center rounded border border-brand-maroon px-8 py-4 text-sm font-bold text-brand-maroon transition hover:bg-brand-maroon/5">
                View All Communities
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
