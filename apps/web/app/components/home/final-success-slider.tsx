'use client';

import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const successStories = [
  { name: 'Rahul & Priya', location: 'Melbourne, VIC', quote: 'Thanks to Vivah Australia, we found each other and built a beautiful life together.', img: '/home/success-stories/couple-05-v2.png' },
  { name: 'Amit & Neha', location: 'Sydney, NSW', quote: 'We connected, we understood and the rest is our forever story.', img: '/home/success-stories/couple-06-v2.png' },
  { name: 'Karan & Simran', location: 'Brisbane, QLD', quote: 'Vivah Australia made our journey so smooth and meaningful.', img: '/home/success-stories/couple-02-v2.png' },
  { name: 'Dev & Isha', location: 'Perth, WA', quote: 'A platform that truly understands Indian culture and values.', img: '/home/success-stories/couple-03-v2.png' },
  { name: 'Varun & Aditi', location: 'Adelaide, SA', quote: 'From the first chat to our wedding day, an incredible experience.', img: '/home/success-stories/couple-04-v2.png' },
];

export function FinalSuccessSlider({ isDark = false }: { isDark?: boolean }) {
  const autoplay = useMemo(() => {
    return Autoplay({
      delay: 4500,
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
    <section className={`${isDark ? 'bg-[#1a1a1a]' : 'bg-white'} py-24 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-brand-maroon mb-4">
            Success Stories
          </p>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold ${isDark ? 'text-white' : 'text-brand-charcoal'} mb-4`}>
            Real Stories. Real Connections.
          </h2>
          <div className="flex items-center justify-center gap-2">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand-gold" />
            <div className="size-1.5 rotate-45 bg-brand-gold" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-brand-gold" />
          </div>
        </div>

        {/* Slider Container */}
        <div className="relative px-0 md:px-16">
          {/* Left Arrow */}
          <button 
            onClick={showPreviousStory}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 size-10 sm:size-12 rounded-full ${isDark ? 'bg-[#2f2f2f] text-brand-gold hover:bg-[#3f3f3f]' : 'bg-white text-brand-maroon hover:bg-gray-50'} shadow-[0_4px_20px_rgba(0,0,0,0.08)] hidden md:flex items-center justify-center transition`}
          >
            <ChevronLeft className="size-6" />
          </button>

          {/* Right Arrow */}
          <button 
            onClick={showNextStory}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 size-10 sm:size-12 rounded-full ${isDark ? 'bg-[#2f2f2f] text-brand-gold hover:bg-[#3f3f3f]' : 'bg-white text-brand-maroon hover:bg-gray-50'} shadow-[0_4px_20px_rgba(0,0,0,0.08)] hidden md:flex items-center justify-center transition`}
          >
            <ChevronRight className="size-6" />
          </button>

          {/* Cards Slider */}
          <div className="overflow-hidden py-4 -my-4" ref={carouselRef}>
            <div className="flex -ml-6 cursor-grab active:cursor-grabbing">
              {successStories.map((story, idx) => (
                <div key={idx} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-6">
                  <div className={`${isDark ? 'bg-[#2f2f2f] border-white/5' : 'bg-white border-gray-50'} rounded-[32px] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border flex flex-col gap-6 h-full text-center transition hover:shadow-lg`}>
                    {/* Image */}
                    <div className="relative w-full rounded-[24px] overflow-hidden aspect-[4/3]">
                      <Image src={story.img} alt={story.name} fill className="object-cover transition-transform duration-700 hover:scale-105" />
                    </div>
                    {/* Content */}
                    <div className="flex flex-col items-center justify-center flex-1">
                      <h4 className={`font-bold ${isDark ? 'text-white' : 'text-brand-charcoal'} text-lg sm:text-xl mb-1.5`}>{story.name}</h4>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-400'} text-xs sm:text-sm mb-5 uppercase tracking-widest font-semibold`}>{story.location}</p>
                      <p className={`${isDark ? 'text-white/70' : 'text-gray-600'} text-sm sm:text-[15px] leading-relaxed mb-6 italic px-2`}>
                        &quot;{story.quote}&quot;
                      </p>
                      {/* Stars */}
                      <div className="flex gap-1.5 text-brand-gold mt-auto">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="size-4 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2.5 mt-10">
          {successStories.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show success story ${index + 1}`}
              aria-current={activeStory === index ? 'true' : undefined}
              onClick={() => goToSlide(index)}
              className={`size-2.5 rounded-full transition-all duration-300 ${activeStory === index ? 'bg-[#d4a04c]' : isDark ? 'bg-transparent border border-white/40 hover:bg-white/20' : 'bg-transparent border border-gray-300 hover:bg-gray-100'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
