'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';

const storyCards = [
  {
    title: 'Neha & Chirag',
    body: 'We both grew up in Melbourne but somehow never crossed paths until Vivah Australia. Having a platform that understood the balance between our modern careers and traditional family values made all the difference.',
    location: 'Melbourne, VIC',
    imageUrl: '/success-stories/couple-melbourne.jpg',
  },
  {
    title: 'Priya & Kunal',
    body: "I was skeptical about online matrimony, but the verified profiles gave my parents peace of mind. We met for coffee in Sydney and ended up talking for hours. We're getting married next spring!",
    location: 'Sydney, NSW',
    imageUrl: '/home/success-stories/couple-02.jpg',
  },
  {
    title: 'Anjali & Manish',
    body: 'Finding someone who understood the nuances of moving from India to Perth was important to me. Vivah helped me find my best friend and life partner in one go.',
    location: 'Perth, WA',
    imageUrl: '/success-stories/couple-brisbane.jpg',
  }
];

export function BentoSuccessStories() {
  return (
    <section className="relative overflow-hidden bg-white py-20">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#D4A04C]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4A04C]">
              Real Australian Love Stories
            </span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#D4A04C]" />
          </div>
          <h2 className="font-playfair text-4xl font-bold text-[#2F2F2F] sm:text-5xl">Marriages Made in Australia. Rooted in Tradition.</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Feature story */}
          {storyCards[0] && (
            <motion.article
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="group relative h-[420px] overflow-hidden rounded-[32px] shadow-[0_24px_65px_rgba(161,14,77,0.10)] sm:h-[520px]"
            >
              <Image
                src={storyCards[0].imageUrl}
                alt={storyCards[0].title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(47,9,28,0.85)_100%)]" />
              <div className="absolute left-6 top-6 flex items-center gap-1.5 rounded-full border border-[#D4A04C]/50 bg-black/30 px-3.5 py-1.5 backdrop-blur-sm">
                <Sparkles className="size-3 fill-[#D4A04C] text-[#D4A04C]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#F7D88A]">Vivah Story</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-7">
                <p className="font-cormorant text-5xl font-bold italic leading-none text-[#D4A04C]/60">&ldquo;</p>
                <p className="mt-1 line-clamp-3 font-cormorant text-xl font-semibold italic leading-7 text-white/95 sm:text-2xl sm:leading-8">
                  {storyCards[0].body}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4">
                  <div>
                    <p className="font-playfair text-xl font-bold text-white">{storyCards[0].title}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <MapPin className="size-3 text-[#D4A04C]" />
                      <p className="text-xs font-medium text-white/65">{storyCards[0].location}</p>
                    </div>
                  </div>
                  <Link
                    href="/blog"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#F7D88A] transition-[gap] hover:gap-3"
                  >
                    Read story <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </motion.article>
          )}

          {/* Two stacked stories */}
          <div className="grid gap-6">
            {storyCards.slice(1, 3).map((story, i) => (
              <motion.article
                key={story.title}
                initial={{ opacity: 0, x: 28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="group relative h-[248px] overflow-hidden rounded-[28px] shadow-[0_18px_50px_rgba(161,14,77,0.08)]"
              >
                <Image
                  src={story.imageUrl}
                  alt={story.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(47,9,28,0.85)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <p className="line-clamp-2 font-cormorant text-lg font-semibold italic leading-6 text-white/95">
                    &ldquo;{story.body}&rdquo;
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-3">
                    <div>
                      <p className="font-playfair text-base font-bold text-white">{story.title}</p>
                      <div className="mt-0.5 flex items-center gap-1">
                        <MapPin className="size-2.5 text-[#D4A04C]" />
                        <p className="text-[11px] text-white/65">{story.location}</p>
                      </div>
                    </div>
                    <Link
                      href="/blog"
                      className="flex items-center gap-1 text-[11px] font-bold text-[#F7D88A] transition-[gap] hover:gap-2"
                    >
                      Read <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
