import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SliderItem, formatGoogleDriveImageUrl } from '../types';
import { ChevronLeft, ChevronRight, Award, FileText, GraduationCap, Eye, Sparkles, ArrowUpRight, BookOpen } from 'lucide-react';

interface HeroSliderProps {
  heroTitle: string;
  heroSubTitle: string;
  sliderItems: SliderItem[];
  itemsCount: number;
  formsCount: number;
  branchesCount: number;
  totalVisits: number;
  onExploreClick?: () => void;
  onFormsClick?: () => void;
}

// Default high-quality educational/academic fallback images matching EduFlex style
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop", // Student with tablet
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop", // Academic/Instructor smiling
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop", // Presenter/Researcher with folders
];

export const HeroSlider: React.FC<HeroSliderProps> = ({
  heroTitle,
  heroSubTitle,
  sliderItems = [],
  itemsCount = 0,
  formsCount = 0,
  branchesCount = 0,
  totalVisits = 0,
  onExploreClick,
  onFormsClick
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Extract valid image URLs from Google Sheet slider data
  const validImages = sliderItems
    .map(s => formatGoogleDriveImageUrl(s.ImageURL))
    .filter(url => url && typeof url === 'string' && url.startsWith('http'));

  // Merge Google Sheet images with fallbacks if needed so we always have at least 3 distinct photos
  const displayImages = validImages.length >= 3 
    ? validImages 
    : [...validImages, ...FALLBACK_IMAGES.slice(validImages.length)];

  // Auto-advance slider every 5 seconds if multiple images exist
  useEffect(() => {
    if (displayImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % displayImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [displayImages.length]);

  const img1 = displayImages[currentIndex % displayImages.length];
  const img2 = displayImages[(currentIndex + 1) % displayImages.length];
  const img3 = displayImages[(currentIndex + 2) % displayImages.length];

  return (
    <section className="relative bg-[#FAF9FE] pt-8 sm:pt-14 pb-12 sm:pb-16 overflow-hidden border-b border-slate-200/60">
      
      {/* Decorative background stars / shapes (EduFlex Style) */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-40">
        <Sparkles className="absolute top-8 left-4 lg:left-6 w-6 h-6 text-violet-400/80 animate-pulse hidden sm:block" />
        <Sparkles className="absolute bottom-20 right-[12%] w-7 h-7 text-[#2A9D80]/80" />
        <div className="absolute top-1/3 right-[28%] w-4 h-4 rounded-full bg-sky-300/60"></div>
        <div className="absolute bottom-1/4 right-[5%] w-6 h-6 rounded-full bg-violet-300/60"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Hero Content Column (Title & Subtitle on Top) */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
            
            {/* Main Display Headline (Two lines: Line 1 large, Line 2 smaller with Viridian Green) */}
            <h1 className="font-prompt tracking-tight leading-tight w-full">
              <span className="block text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900">
                ตำแหน่งทางวิชาการ
              </span>
              <span className="block text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 sm:mt-2" style={{ color: '#007A6D' }}>
                มหาวิทยาลัยศิลปากร
              </span>
            </h1>

            {/* Subtitle Paragraph (Font Sarabun) */}
            <p className="text-xs sm:text-sm text-slate-600 font-sarabun font-normal max-w-xl leading-relaxed mx-auto lg:mx-0">
              {heroSubTitle || 'รวมหลักเกณฑ์ ข้อคำถามพบบ่อย (Q&A) และหนังสือเวียนคณะ/ตอบข้อหารือเกี่ยวกับการเสนอกำหนดตำแหน่งทางวิชาการ มหาวิทยาลัยศิลปากร'}
            </p>
          </div>

          {/* Right EduFlex Bento Photo Grid Composition Column */}
          <div className="lg:col-span-6 relative z-20 pt-4 pb-2 px-2 sm:px-4">
            
            {/* Top Row: Two Portrait Cards + Floating Badge */}
            <div className="grid grid-cols-12 gap-3 sm:gap-4 items-end relative">
              
              {/* Card 1: Top-Left Card (Sky Blue Background) */}
              <div className="col-span-6 bg-[#CDE5FA] rounded-[2rem] sm:rounded-[2.4rem] p-1.5 sm:p-2 aspect-[4/4.8] overflow-hidden shadow-sm hover:shadow-md transition-all group relative border border-sky-200/60">
                <div className="w-full h-full rounded-[1.6rem] sm:rounded-[2rem] overflow-hidden bg-sky-100 relative">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={img1}
                      src={img1}
                      initial={{ opacity: 0, scale: 1.08 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      alt="Academic Portrait 1"
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMAGES[0];
                      }}
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none"></div>
                </div>
              </div>

              {/* Card 2: Top-Right Card (Lavender Background) + Floating Arrow Circle */}
              <div className="col-span-6 bg-[#E5DCFF] rounded-[2rem] sm:rounded-[2.4rem] p-1.5 sm:p-2 aspect-[4/4.8] shadow-sm hover:shadow-md transition-all group relative border border-purple-200/60 z-10">
                
                {/* Floating Arrow Badge (EduFlex Style Top-Right brought to front) */}
                <div className="absolute -top-3 -right-2 sm:-top-4 sm:-right-3 z-40 w-10 h-10 sm:w-12 sm:h-12 bg-[#80C8F8] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white transform hover:rotate-45 transition-transform duration-300">
                  <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                </div>

                {/* Floating purple dot near right */}
                <div className="absolute top-1/2 -right-3 z-30 w-3 h-3 bg-purple-300/80 rounded-full"></div>

                <div className="w-full h-full rounded-[1.6rem] sm:rounded-[2rem] overflow-hidden bg-purple-100 relative">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={img2}
                      src={img2}
                      initial={{ opacity: 0, scale: 1.08 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      alt="Academic Portrait 2"
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMAGES[1];
                      }}
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none"></div>
                </div>
              </div>

            </div>

            {/* Bottom Row: Landscape Photo Card + Concentric Rings Pill Card */}
            <div className="grid grid-cols-12 gap-3 sm:gap-4 mt-3 sm:mt-4 items-center relative">
              
              {/* Card 3: Bottom-Left Card (Sage Green Background) */}
              <div className="col-span-7 bg-[#2A9D80]/20 rounded-[2rem] sm:rounded-[2.4rem] p-1.5 sm:p-2 aspect-[16/10] shadow-sm hover:shadow-md transition-all group relative border border-[#2A9D80]/40 z-10">
                
                {/* Floating Star Icon (brought to front) */}
                <div className="absolute -bottom-2 -left-2 z-40">
                  <Sparkles className="w-6 h-6 text-[#2A9D80] fill-[#2A9D80]/20 animate-pulse drop-shadow-sm" />
                </div>

                <div className="w-full h-full rounded-[1.6rem] sm:rounded-[2rem] overflow-hidden bg-emerald-100 relative">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={img3}
                      src={img3}
                      initial={{ opacity: 0, scale: 1.08 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      alt="Academic Photo 3"
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMAGES[2];
                      }}
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none"></div>
                </div>
              </div>

              {/* Card 4: Bottom-Right Decorative Pill Card (Lavender Vector) */}
              <div className="col-span-5 bg-[#C5B5F0] rounded-full p-4 sm:p-5 h-full flex items-center justify-center shadow-xs border border-purple-300/60 relative overflow-hidden group hover:scale-102 transition-transform">
                
                {/* Concentric rings vector pattern */}
                <div className="flex items-center justify-center -space-x-3 text-white/90">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/90 bg-white/10"></div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/90 bg-white/10"></div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/90 bg-white/10"></div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/90 bg-white/10"></div>
                </div>

                {/* Floating light blue circle dot */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-sky-200 rounded-full border-2 border-white"></div>
              </div>

            </div>

            {/* Slide Navigation Controls & Indicators */}
            {displayImages.length > 1 && (
              <div className="mt-4 flex items-center justify-between px-2">
                <div className="flex items-center space-x-1.5">
                  {displayImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === currentIndex ? 'w-6 bg-violet-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                      title={`สไลด์ที่ ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentIndex(prev => (prev - 1 + displayImages.length) % displayImages.length)}
                    className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-violet-600 hover:text-white transition-colors cursor-pointer shadow-xs"
                    title="ภาพก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentIndex(prev => (prev + 1) % displayImages.length)}
                    className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-violet-600 hover:text-white transition-colors cursor-pointer shadow-xs"
                    title="ภาพถัดไป"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </section>
  );
};
