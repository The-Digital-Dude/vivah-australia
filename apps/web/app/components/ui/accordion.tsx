'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

interface AccordionItemProps {
  value: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ trigger, children, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border-b border-[#A10E4D]/10 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left font-semibold text-[#2F2F2F] transition hover:text-[#A10E4D] focus:outline-none focus:ring-2 focus:ring-[#A10E4D]/20 focus:ring-offset-2 rounded-sm"
        aria-expanded={isOpen}
      >
        <span className="text-sm leading-6 pr-4">{trigger}</span>
        <ChevronDown
          className={cx(
            'size-5 shrink-0 text-[#A10E4D] transition-transform duration-300',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>
      <div
        className={cx(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-96 pb-5' : 'max-h-0',
        )}
      >
        <div className="text-sm leading-7 text-[#5E6470]">{children}</div>
      </div>
    </div>
  );
}

interface AccordionProps {
  items: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  allowMultiple?: boolean;
  onItemOpen?: (id: string) => void;
}

export function Accordion({ items, allowMultiple = false, onItemOpen }: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) {
          next.clear();
        }
        next.add(id);
        onItemOpen?.(id);
      }
      return next;
    });
  }

  return (
    <div className="divide-y-0">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          trigger={item.question}
          isOpen={openItems.has(item.id)}
          onToggle={() => toggle(item.id)}
        >
          {item.answer}
        </AccordionItem>
      ))}
    </div>
  );
}
