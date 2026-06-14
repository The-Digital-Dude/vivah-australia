import { PublicHeader, PublicFooter } from '@/app/components';
import { FinalSuccessSlider } from '@/app/components/home/final-success-slider';
import Image from 'next/image';

export const metadata = {
  title: 'Success Stories | Vivah Australia',
  description: 'Read heartwarming success stories of couples who met on Vivah Australia.',
};

export default function SuccessStoriesPage() {
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
              Love Found. <br className="sm:hidden" />
              <span className="text-brand-gold">Journeys Shared.</span>
            </h1>
            <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-8">
              Discover how Vivah Australia brings Indian singles together to build beautiful, lasting marriages. Our success stories are a testament to meaningful connections.
            </p>
          </div>
        </section>

        {/* FEATURED STORY */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative w-full aspect-[4/3] rounded-[32px] overflow-hidden shadow-2xl">
              <Image src="/home/success-stories/couple-03.jpg" alt="Rahul & Priya" fill className="object-cover" />
            </div>
            <div>
              <p className="text-brand-gold text-sm font-bold uppercase tracking-widest mb-3">Featured Story</p>
              <h2 className="text-3xl sm:text-4xl font-playfair font-bold text-brand-charcoal mb-6">
                "From a simple message to a beautiful forever."
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Rahul and Priya found each other on Vivah Australia when their families were looking for the perfect match. Despite living in different states, their shared values and cultural background created an instant bond.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                "We were both focused on our careers but wanted a traditional family life. Vivah Australia's detailed profiles helped us see beyond just photos. Our parents met within a month, and the rest is history!"
              </p>
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="font-bold text-brand-charcoal">Rahul & Priya</span>
                  <span className="text-sm text-gray-500">Sydney, NSW</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MORE STORIES */}
        <div className="pt-20 pb-24">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-playfair font-bold text-brand-charcoal mb-4">More Happy Couples</h2>
          </div>
          <FinalSuccessSlider />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
