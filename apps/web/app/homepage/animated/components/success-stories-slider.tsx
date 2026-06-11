'use client';

import Image from 'next/image';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, type Variants } from 'framer-motion';

const successStories = [
  {
    names: 'Neha & Chirag',
    location: 'Melbourne, VIC',
    image: '/home/success-stories/couple-01.jpg',
    quote:
      'We found each other on Vivah Australia and today we are starting our beautiful journey together. Thank you Vivah Australia!',
  },
  {
    names: 'Priya & Kunal',
    location: 'Sydney, NSW',
    image: '/home/success-stories/couple-02.jpg',
    quote:
      'The verification process gave us confidence and the platform helped us find a compatible match.',
  },
  {
    names: 'Anjali & Manish',
    location: 'Brisbane, QLD',
    image: '/home/success-stories/couple-03.jpg',
    quote:
      'A trustworthy platform with genuine profiles and great support from the Vivah Australia team.',
  },
  {
    names: 'Riya & Arjun',
    location: 'Perth, WA',
    image: '/home/success-stories/couple-04.jpg',
    quote:
      'The matches felt serious and family-oriented. We connected quickly and everything moved naturally from there.',
  },
  {
    names: 'Meera & Rohan',
    location: 'Adelaide, SA',
    image: '/home/success-stories/couple-05.jpg',
    quote: 'Vivah Australia made the search respectful, simple, and safe for both our families.',
  },
  {
    names: 'Isha & Dev',
    location: 'Canberra, ACT',
    image: '/home/success-stories/couple-06.jpg',
    quote:
      'We appreciated the verified profiles and clear member details. It helped us focus on the right conversations.',
  },
  {
    names: 'Kavya & Nikhil',
    location: 'Gold Coast, QLD',
    image: '/home/success-stories/couple-07.jpg',
    quote:
      'From the first message to meeting our families, the experience felt calm, private, and genuine.',
  },
  {
    names: 'Simran & Harsh',
    location: 'Geelong, VIC',
    image: '/home/success-stories/couple-08.jpg',
    quote:
      'We both wanted a serious relationship within the Indian community in Australia, and this platform brought us together.',
  },
  {
    names: 'Aditi & Varun',
    location: 'Hobart, TAS',
    image: '/home/success-stories/couple-09.jpg',
    quote:
      'The search filters helped us discover someone aligned with our values, lifestyle, and future plans.',
  },
  {
    names: 'Pooja & Sameer',
    location: 'Newcastle, NSW',
    image: '/home/success-stories/couple-10.jpg',
    quote:
      'We liked that the platform felt premium without being overwhelming. It gave our families confidence too.',
  },
  {
    names: 'Naina & Akash',
    location: 'Darwin, NT',
    image: '/home/success-stories/couple-11.jpg',
    quote:
      'Finding a compatible match across Australia felt much easier with verified profiles and thoughtful details.',
  },
  {
    names: 'Tara & Mihir',
    location: 'Wollongong, NSW',
    image: '/home/success-stories/couple-12.jpg',
    quote:
      'We started with one honest conversation and soon realised our families, goals, and expectations matched beautifully.',
  },
] as const;

const autoScrollDelayMs = 4500;

export function SuccessStoriesSlider() {
  const autoplay = useMemo(() => {
    return Autoplay({
      delay: autoScrollDelayMs,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    });
  }, []);
  const [carouselRef, carouselApi] = useEmblaCarousel(
    {
      align: 'start',
      loop: true,
    },
    [autoplay],
  );
  const [activeStory, setActiveStory] = useState(0);

  const goToSlide = useCallback(
    (story: number) => {
      carouselApi?.scrollTo(story);
    },
    [carouselApi],
  );

  const showPreviousStory = useCallback(() => {
    carouselApi?.scrollPrev();
  }, [carouselApi]);

  const showNextStory = useCallback(() => {
    carouselApi?.scrollNext();
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const updateActiveStory = () => {
      setActiveStory(carouselApi.selectedScrollSnap());
    };

    updateActiveStory();
    carouselApi.on('select', updateActiveStory);
    carouselApi.on('reInit', updateActiveStory);

    return () => {
      carouselApi.off('select', updateActiveStory);
      carouselApi.off('reInit', updateActiveStory);
    };
  }, [carouselApi]);

  return (
    <section className="bg-[#fff9f5] px-8 py-14 sm:px-12 lg:px-16">
      <div className="container mx-auto">
        <div className="mb-8 flex flex-col items-center gap-4 text-center sm:relative">
          <div>
            <div className="mx-auto mb-2 flex items-center justify-center gap-3 text-[#d4a04c]">
              <span className="h-px w-12 bg-[#d4a04c]/70" />

              <h2 className="font-playfair text-3xl font-bold leading-tight text-[#2f2f2f] sm:text-4xl">
                Success Stories
              </h2>
              <span className="h-px w-12 bg-[#d4a04c]/70" />
            </div>
            <p className="mt-2 text-sm font-medium text-[#5f5f5f] sm:text-base">
              Real stories of love and companionship
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="sm:absolute sm:right-0 sm:top-0"
          >
            <Link
              href="/success-stories"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#a10e4d]/25 bg-white px-5 text-sm font-semibold text-[#a10e4d] shadow-sm transition hover:border-[#a10e4d]/45 hover:bg-[#fff4f8] focus:outline-none focus:ring-4 focus:ring-[#e74c7c]/20"
            >
              View All Stories
            </Link>
          </motion.div>
        </div>

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: '#fff9f5', borderColor: '#a10e4d' }}
            whileTap={{ scale: 0.95 }}
            type="button"
            aria-label="Previous success stories"
            onClick={showPreviousStory}
            className="absolute left-0 top-1/2 z-10 hidden size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#a10e4d]/10 bg-white text-[#2f2f2f] shadow-[0_10px_28px_rgba(47,47,47,0.14)] transition hover:text-[#a10e4d] focus:outline-none focus:ring-4 focus:ring-[#e74c7c]/20 md:inline-flex"
          >
            <ChevronLeft className="size-5" />
          </motion.button>

          <div ref={carouselRef} className="overflow-hidden px-10 py-2">
            <div className="-ml-8 flex gap-4 cursor-grab active:cursor-grabbing">
              {successStories.map((story) => (
                <div key={story.names} className="min-w-0 flex-[0_0_100%] md:flex-[0_0_33.333%]">
                  <motion.article
                    whileHover="hover"
                    variants={{
                      hover: { y: -5 }
                    }}
                    className="grid h-full min-h-[190px] grid-cols-1 gap-5 rounded-lg shadow-[rgba(0,0,0,0.1)_0px_1px_3px_0px,rgba(0,0,0,0.06)_0px_1px_2px_0px] bg-white p-5 sm:grid-cols-[160px_1fr] md:grid-cols-1 xl:grid-cols-[160px_1fr] transition-all duration-300 cursor-pointer"
                  >
                    <motion.div
                      variants={{
                        hover: { scale: 1.05 }
                      }}
                      transition={{ duration: 0.3 }}
                      className="relative size-40 shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#fff4f8] shadow-[0_8px_22px_rgba(161,14,77,0.14)]"
                    >
                      <Image
                        src={story.image}
                        alt={`${story.names} success story`}
                        fill
                        sizes="160px"
                        className="object-cover object-top"
                      />
                    </motion.div>
                    <div className="min-w-0">
                      <motion.div
                        variants={{
                          hover: { rotate: [0, -15, 15, 0], scale: 1.15, transition: { duration: 0.5 } }
                        }}
                        className="inline-block"
                      >
                        <Quote className="mb-1 size-5 fill-[#d4a04c] text-[#d4a04c]" />
                      </motion.div>
                      <p className="text-sm font-medium leading-6 text-[#2f2f2f]">{story.quote}</p>
                      <p className="mt-4 text-sm font-bold text-[#2f2f2f]">- {story.names}</p>
                      <p className="mt-1 text-xs font-medium text-[#5f5f5f]">{story.location}</p>
                    </div>
                  </motion.article>
                </div>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: '#fff9f5', borderColor: '#a10e4d' }}
            whileTap={{ scale: 0.95 }}
            type="button"
            aria-label="Next success stories"
            onClick={showNextStory}
            className="absolute right-0 top-1/2 z-10 hidden size-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#a10e4d]/10 bg-white text-[#2f2f2f] shadow-[0_10px_28px_rgba(47,47,47,0.14)] transition hover:text-[#a10e4d] focus:outline-none focus:ring-4 focus:ring-[#e74c7c]/20 md:inline-flex"
          >
            <ChevronRight className="size-5" />
          </motion.button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            aria-label="Previous success stories"
            onClick={showPreviousStory}
            className="inline-flex size-10 items-center justify-center rounded-full border border-[#a10e4d]/10 bg-white text-[#2f2f2f] shadow-sm md:hidden"
          >
            <ChevronLeft className="size-5" />
          </motion.button>
          {successStories.map((_, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              aria-label={`Show success story ${index + 1}`}
              aria-current={activeStory === index ? 'true' : undefined}
              onClick={() => goToSlide(index)}
              className={`size-2.5 rounded-full transition ${
                activeStory === index ? 'bg-[#a10e4d]' : 'bg-[#d9d2ce] hover:bg-[#d4a04c]'
              }`}
            />
          ))}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            aria-label="Next success stories"
            onClick={showNextStory}
            className="inline-flex size-10 items-center justify-center rounded-full border border-[#a10e4d]/10 bg-white text-[#2f2f2f] shadow-sm md:hidden"
          >
            <ChevronRight className="size-5" />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
