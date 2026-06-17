import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star, ArrowRight, Sparkles, Quote, MapPin, Users } from 'lucide-react';
import { PublicHeader, PublicFooter } from '@/app/components';
import { FinalSuccessSlider } from '@/app/components/home/final-success-slider';

export const metadata: Metadata = {
  title: 'Success Stories | Vivah Australia',
  description:
    'Read heartwarming stories of couples who found their life partners through Vivah Australia — Australia\'s most trusted Indian matrimonial platform.',
};

const featuredStory = {
  names: 'Arjun & Meera',
  location: 'Sydney, NSW',
  married: 'March 2024',
  img: '/home/success-stories/couple-03.jpg',
  quote: 'From a simple message to a beautiful forever.',
  story: [
    "Arjun was a software engineer in Sydney and Meera was a doctor in Melbourne. Both were focused on their careers but felt the pull of wanting a life partner who truly understood their cultural values.",
    "Through Vivah Australia, their families connected first. After weeks of conversations about everything from family traditions to long-term dreams, they arranged to meet in person. The connection was instant.",
    "Within six months of matching, Arjun relocated to Melbourne. They were married in a traditional ceremony surrounded by family from both India and Australia. Today they call it the best decision of their lives.",
  ],
};

const stories = [
  {
    names: 'Rahul & Priya',
    location: 'Melbourne, VIC',
    married: 'June 2023',
    img: '/home/success-stories/couple-05.jpg',
    quote: "We were both looking for someone who balanced Australian life with Indian roots. Vivah Australia found us each other.",
    tags: ['Verified Profiles', 'Family Introduction'],
  },
  {
    names: 'Amit & Neha',
    location: 'Sydney, NSW',
    married: 'November 2023',
    img: '/home/success-stories/couple-06.jpg',
    quote: "We connected on values first. That made all the difference. Vivah Australia made it so easy to find someone serious.",
    tags: ['Matched on Values', 'Inter-state Connection'],
  },
  {
    names: 'Karan & Simran',
    location: 'Brisbane, QLD',
    married: 'January 2024',
    img: '/home/success-stories/couple-02.jpg',
    quote: "Vivah Australia understood what we were looking for better than any other platform we had tried.",
    tags: ['Smart Matching', 'Quick Connection'],
  },
  {
    names: 'Dev & Isha',
    location: 'Perth, WA',
    married: 'August 2023',
    img: '/home/success-stories/couple-04.jpg',
    quote: "The verification process gave our families so much confidence. We knew everyone here was genuine.",
    tags: ['Verified Members', 'Family Approved'],
  },
  {
    names: 'Varun & Aditi',
    location: 'Adelaide, SA',
    married: 'April 2024',
    img: '/home/success-stories/couple-01.jpg',
    quote: "From the first chat to our wedding day — every step felt right. We are so grateful for this platform.",
    tags: ['Premium Members', 'Same City'],
  },
  {
    names: 'Siddharth & Kavya',
    location: 'Gold Coast, QLD',
    married: 'February 2024',
    img: '/home/success-stories/couple-07.jpg',
    quote: "I had given up hope of finding someone who matched my values and ambitions. Then I found Sid.",
    tags: ['Career-Focused Match', 'Lifestyle Aligned'],
  },
  {
    names: 'Nikhil & Riya',
    location: 'Canberra, ACT',
    married: 'October 2023',
    img: '/home/success-stories/couple-08.jpg',
    quote: "Our mothers found each other on Vivah Australia and did the rest. We could not be happier!",
    tags: ['Family-Assisted', 'Verified Profiles'],
  },
  {
    names: 'Aakash & Divya',
    location: 'Darwin, NT',
    married: 'May 2024',
    img: '/home/success-stories/couple-09.jpg',
    quote: "Even in a smaller city, Vivah Australia found us a perfect match. Distance was never an obstacle.",
    tags: ['Regional Match', 'Long-Distance'],
  },
  {
    names: 'Rohan & Anjali',
    location: 'Hobart, TAS',
    married: 'December 2023',
    img: '/home/success-stories/couple-10.jpg',
    quote: "We spoke for months before meeting. By the time we did, we already knew we were meant to be.",
    tags: ['Deep Connection', 'Values-Based'],
  },
];

const stats = [
  { value: '500+', label: 'Success Stories' },
  { value: '98%', label: 'Member Satisfaction' },
  { value: '8', label: 'States & Territories' },
  { value: '3 months', label: 'Avg. Time to Match' },
];

export default function SuccessStoriesPage() {
  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      <main>
        {/* HERO */}
        <section className="relative bg-brand-maroon pt-24 pb-36 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.3),transparent_60%)]" />
          <div className="relative z-10 mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 text-center">
            <div className="flex justify-center mb-5">
              <Heart className="size-10 text-brand-gold fill-brand-gold/30" strokeWidth={1.5} />
            </div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-4">
              Real Couples. Real Journeys.
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-playfair text-white leading-tight mb-6">
              Love Found.<br />
              <span className="text-brand-gold">Journeys Shared.</span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              Every couple here started exactly where you are — with hope, a profile, and a belief that the right person was out there. These are their stories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded bg-brand-gold px-8 py-4 text-base font-bold text-brand-charcoal transition hover:bg-brand-gold/90"
              >
                Start Your Story <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/matches"
                className="inline-flex items-center justify-center gap-2 rounded border border-white/30 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10"
              >
                Browse Members
              </Link>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
            </svg>
          </div>
        </section>

        {/* STATS */}
        <section className="py-16 px-6 sm:px-8 lg:px-12 bg-brand-ivory">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center">
                  <p className="text-3xl sm:text-4xl font-bold font-playfair text-brand-maroon mb-2">{s.value}</p>
                  <p className="text-sm font-semibold text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED STORY */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-3">Featured Couple</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-brand-charcoal">
                This Month&apos;s Story
              </h2>
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand-gold" />
                <div className="size-1.5 rotate-45 bg-brand-gold" />
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-brand-gold" />
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Image */}
              <div className="relative">
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src={featuredStory.img}
                    alt={featuredStory.names}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                    <div>
                      <p className="text-white font-bold text-xl font-playfair">{featuredStory.names}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="size-3.5 text-brand-gold" />
                        <span className="text-white/80 text-sm">{featuredStory.location}</span>
                      </div>
                    </div>
                    <span className="bg-brand-gold text-brand-charcoal text-xs font-bold px-3 py-1.5 rounded-full">
                      Married {featuredStory.married}
                    </span>
                  </div>
                </div>
                {/* Floating quote badge */}
                <div className="absolute -top-5 -right-5 bg-brand-maroon text-white rounded-2xl px-4 py-3 shadow-xl max-w-[180px] hidden sm:block">
                  <div className="flex gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3 fill-brand-gold text-brand-gold" />
                    ))}
                  </div>
                  <p className="text-xs font-semibold leading-snug text-white/90">Verified Success Story</p>
                </div>
              </div>

              {/* Story text */}
              <div>
                <Quote className="size-8 text-brand-gold mb-4" />
                <blockquote className="text-2xl sm:text-3xl font-playfair font-bold text-brand-charcoal leading-snug mb-8">
                  &ldquo;{featuredStory.quote}&rdquo;
                </blockquote>
                <div className="space-y-4 mb-8">
                  {featuredStory.story.map((para, i) => (
                    <p key={i} className="text-gray-600 text-base leading-relaxed">{para}</p>
                  ))}
                </div>
                <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                  <div className="size-12 rounded-full bg-brand-maroon flex items-center justify-center text-white font-bold font-playfair text-lg">
                    A
                  </div>
                  <div>
                    <p className="font-bold text-brand-charcoal">{featuredStory.names}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <MapPin className="size-3.5" /> {featuredStory.location} · Married {featuredStory.married}
                    </p>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-brand-gold text-brand-gold" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STORIES GRID */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-brand-ivory border-t border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">Their Stories</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-brand-charcoal">
                More Happy Couples
              </h2>
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand-gold" />
                <div className="size-1.5 rotate-45 bg-brand-gold" />
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-brand-gold" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <div
                  key={story.names}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={story.img}
                      alt={story.names}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div>
                        <p className="text-white font-bold text-base font-playfair">{story.names}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="size-3 text-brand-gold" />
                          <span className="text-white/75 text-xs">{story.location}</span>
                        </div>
                      </div>
                      <span className="bg-brand-gold/90 text-brand-charcoal text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                        {story.married}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col gap-4 flex-1">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="size-3.5 fill-brand-gold text-brand-gold" />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed italic flex-1">
                      &ldquo;{story.quote}&rdquo;
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                      {story.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-brand-ivory text-brand-maroon text-xs font-semibold px-3 py-1 rounded-full border border-brand-maroon/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SLIDER */}
        <FinalSuccessSlider />

        {/* SUBMIT YOUR STORY */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">Share the Love</p>
              <h2 className="text-3xl sm:text-4xl font-playfair font-bold text-brand-charcoal mb-5 leading-tight">
                Found Your Match<br />on Vivah Australia?
              </h2>
              <p className="text-gray-600 text-base leading-relaxed mb-6">
                Your story could inspire someone else to take the leap. Share your journey with our community — we would love to celebrate your love and let others know that meaningful connections are possible.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Stories are shared with your permission only',
                  'Helps other members feel inspired and confident',
                  'Celebrates your milestone with the community',
                ].map((point) => (
                  <li key={point} className="flex items-center gap-3 text-sm text-brand-charcoal">
                    <Heart className="size-4 text-brand-maroon fill-brand-maroon/20 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-maroon px-8 py-4 text-base font-bold text-white transition hover:bg-brand-maroon/90"
              >
                Share Your Story <ArrowRight className="size-4" />
              </Link>
            </div>

            {/* Collage of couples */}
            <div className="grid grid-cols-2 gap-3">
              {[
                '/home/success-stories/couple-11.jpg',
                '/home/success-stories/couple-12.jpg',
                '/home/success-stories/couple-09.jpg',
                '/home/success-stories/couple-10.jpg',
              ].map((src, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden shadow-md">
                  <Image src={src} alt="Happy couple" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMMUNITY TRUST STRIP */}
        <section className="py-14 px-6 sm:px-8 lg:px-12 bg-brand-ivory border-t border-gray-100">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-brand-maroon flex items-center justify-center">
                <Users className="size-7 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-bold font-playfair text-brand-maroon">10,000+ Members</p>
                <p className="text-sm text-gray-500">Across Australia</p>
              </div>
            </div>
            <div className="hidden sm:block h-12 w-px bg-gray-200" />
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-6 fill-brand-gold text-brand-gold" />
              ))}
              <span className="ml-2 font-bold text-brand-charcoal text-base self-center">4.9 / 5</span>
            </div>
            <div className="hidden sm:block h-12 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <Sparkles className="size-6 text-brand-gold" />
              <p className="text-base font-semibold text-brand-charcoal">500+ Engagements & Marriages</p>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-brand-maroon py-20 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,160,76,0.12),transparent_60%)]" />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <Heart className="size-10 text-brand-gold fill-brand-gold/30 mx-auto mb-5" strokeWidth={1.5} />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-white mb-5">
              Your Story Starts Here
            </h2>
            <p className="text-white/65 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              Join the hundreds of couples who found their forever on Vivah Australia. Create your free profile today and begin your own journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded bg-brand-gold px-8 py-4 text-base font-bold text-brand-charcoal transition hover:bg-brand-gold/90"
              >
                Create Free Profile <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded border border-white/30 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10"
              >
                How It Works
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
