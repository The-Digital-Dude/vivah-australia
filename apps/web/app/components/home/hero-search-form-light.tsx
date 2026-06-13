'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { HeroSelect } from './hero-select-light';

export function HeroSearchForm() {
  return (
    <section className="relative z-10 overflow-hidden px-8 py-14 sm:px-12 lg:px-16">
      <motion.form
        action="/matches"
        className="relative mx-auto container overflow-hidden rounded-[28px] border border-[#D9A05B]/30 bg-gradient-to-br from-white to-[#FDFBF7] px-5 py-8 shadow-[0_40px_100px_rgba(217,160,91,0.15)] sm:px-8 sm:py-10"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-playfair text-3xl font-bold leading-tight text-[#2A111A] sm:text-4xl lg:text-5xl">
              Start with the details that <span className="bg-gradient-to-r from-[#D9A05B] to-[#E74C7C] bg-clip-text text-transparent">matter most</span>
            </h2>
          </div>

          <p className="max-w-sm text-sm font-medium leading-relaxed text-[#4A0E25] lg:text-right">
            Connect with verified professionals who share your cultural values and lifestyle.
          </p>
        </div>

        <div className="relative mt-7 grid gap-4 rounded-2xl border border-[#D9A05B]/20 bg-[#FCF8F2] p-4 shadow-inner sm:p-5 lg:grid-cols-[1.4fr_0.75fr_0.75fr_1.35fr_1.35fr_auto] lg:items-end">
          <HeroSelect label="I am looking for" name="gender">
            <option value="FEMALE">Bride</option>
            <option value="MALE">Groom</option>
          </HeroSelect>
          <HeroSelect label="Age from" name="minAge">
            <option value="22">22</option>
            <option value="25">25</option>
            <option value="28">28</option>
            <option value="32">32</option>
          </HeroSelect>
          <HeroSelect label="Age to" name="maxAge">
            <option value="32">32</option>
            <option value="36">36</option>
            <option value="40">40</option>
            <option value="45">45</option>
          </HeroSelect>
          <HeroSelect label="Community" name="community">
            <option value="">Any</option>
            <option value="Hindu">Hindu</option>
            <option value="Sikh">Sikh</option>
            <option value="Muslim">Muslim</option>
            <option value="Gujarati">Gujarati</option>
          </HeroSelect>
          <HeroSelect label="Location" name="city">
            <option value="">Australia</option>
            <option value="Melbourne">Melbourne</option>
            <option value="Sydney">Sydney</option>
            <option value="Brisbane">Brisbane</option>
            <option value="Perth">Perth</option>
          </HeroSelect>
          <motion.button
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D9A05B] to-[#C48C45] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(217,160,91,0.35)] transition hover:from-[#C48C45] hover:to-[#AF7830] focus:outline-none focus:ring-4 focus:ring-[#D9A05B]/30"
            type="submit"
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <Search className="size-4 transition group-hover:scale-110" />
            Find Matches
          </motion.button>
        </div>
      </motion.form>
    </section>
  );
}
