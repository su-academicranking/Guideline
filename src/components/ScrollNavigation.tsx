import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp } from 'lucide-react';

export const ScrollNavigation: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled down > 150px
      const currentScroll = window.scrollY;
      setIsVisible(currentScroll > 150);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed bottom-6 right-5 sm:right-6 z-40 select-none"
        >
          <button
            onClick={handleScrollToTop}
            title="เลื่อนกลับขึ้นด้านบน"
            aria-label="Scroll to top"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-slate-50 text-[#2B3A55] border border-slate-200/90 shadow-[0_4px_18px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_22px_rgba(0,0,0,0.12)] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400/40"
          >
            <ChevronUp className="w-5 h-5 text-[#2B3A55] stroke-[2.2]" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

