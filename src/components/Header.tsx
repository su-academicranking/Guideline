import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home,
  BookOpen, 
  FileText, 
  Search, 
  Sparkles, 
  Bookmark, 
  RefreshCw, 
  GraduationCap, 
  Layers, 
  Building2, 
  Menu, 
  X,
  CheckCircle2,
  ChevronRight,
  Clock
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'home' | 'knowledge' | 'forms' | 'branches' | 'about';
  setActiveTab: (tab: 'home' | 'knowledge' | 'forms' | 'branches' | 'about') => void;
  siteName: string;
  subSiteName: string;
  logoUrl: string;
  bookmarksCount: number;
  onOpenBookmarks: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated?: string;
  totalVisits?: number;
  thisMonthVisits?: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const NAV_ITEMS = [
  { 
    id: 'home', 
    label: 'หน้าแรก', 
    desc: 'ภาพรวมระบบและข้อมูลประชาสัมพันธ์', 
    icon: Home,
    color: 'emerald'
  },
  { 
    id: 'knowledge', 
    label: 'คลังความรู้ & Q&A', 
    desc: 'รวมแนวปฏิบัติ คำถามที่พบบ่อย และหนังสือเวียน', 
    icon: BookOpen,
    color: 'emerald'
  },
  { 
    id: 'forms', 
    label: 'หลักเกณฑ์ & แบบฟอร์ม', 
    desc: 'เอกสารแบบฟอร์มและสรุปหลักเกณฑ์แยกตามหมวด', 
    icon: FileText,
    color: 'emerald'
  },
  { 
    id: 'branches', 
    label: 'สาขาวิชาที่ ก.พ.อ. กำหนด', 
    desc: 'สืบค้นรหัสกลุ่มและสาขาวิชาตามประกาศ ก.พ.อ.', 
    icon: GraduationCap,
    color: 'emerald'
  },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  siteName,
  subSiteName,
  logoUrl,
  bookmarksCount,
  onOpenBookmarks,
  onRefresh,
  isRefreshing,
  lastUpdated,
  searchQuery,
  setSearchQuery
}) => {
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  const formattedTime = lastUpdated 
    ? new Date(lastUpdated).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <>
      <header className={`sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all ${sideMenuOpen ? 'z-[9999]' : 'z-40'}`}>
        {/* Main Header Container */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">
            
            {/* Logo Only */}
            <div 
              className="flex items-center cursor-pointer group" 
              onClick={() => setActiveTab('home')}
            >
              <div className="relative flex-shrink-0 h-9 sm:h-11 w-auto flex items-center justify-center group-hover:scale-105 transition-transform">
                <img 
                  src={logoUrl || "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Silpakorn_University.svg"} 
                  alt="Silpakorn Logo" 
                  className="h-9 sm:h-11 w-auto max-w-[120px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            {/* Header Right Actions & Side Menu Trigger */}
            <div className="flex items-center space-x-2">
              
              {/* Quick Bookmark button if has items */}
              {bookmarksCount > 0 && (
                <button
                  onClick={onOpenBookmarks}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-prompt font-semibold bg-purple-50 text-purple-800 border border-purple-200/80 hover:bg-purple-100 transition-all cursor-pointer shadow-2xs"
                  title="รายการที่บันทึกไว้"
                >
                  <Bookmark className="w-3.5 h-3.5 fill-purple-700 text-purple-700" />
                  <span className="hidden md:inline">บันทึก</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-purple-200/80 text-purple-900 rounded-full font-bold">
                    {bookmarksCount}
                  </span>
                </button>
              )}

              {/* Main Side Menu Button */}
              <nav>
                <button
                  onClick={() => setSideMenuOpen(true)}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100/90 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 text-slate-800 border border-slate-200/90 transition-all cursor-pointer font-prompt text-xs font-semibold shadow-2xs group"
                  aria-label="เปิดเมนูนำทาง"
                >
                  <Menu className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                  <span className="font-bold">เมนู</span>
                </button>
              </nav>

            </div>

          </div>
        </div>
      </header>

      {/* Slide-Out Side Menu Drawer using createPortal for high z-index overlay */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {sideMenuOpen && (
            <div className="fixed inset-0 z-[999999]">
              {/* Backdrop Blur Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSideMenuOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[99998]"
              />

              {/* Side Menu Drawer Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                className="fixed top-0 right-0 bottom-0 w-84 sm:w-96 max-w-[88vw] bg-white z-[99999] shadow-2xl flex flex-col justify-between overflow-y-auto font-prompt"
              >
                <div>
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-white">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-auto flex items-center justify-center flex-shrink-0">
                        <img 
                          src={logoUrl || "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Silpakorn_University.svg"} 
                          alt="SU Logo" 
                          className="h-10 w-auto max-w-[120px] object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold font-prompt text-slate-900 leading-tight">
                          ตำแหน่งทางวิชาการ
                        </h2>
                        <p className="text-[11px] font-prompt text-emerald-700 font-semibold">
                          มหาวิทยาลัยศิลปากร
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSideMenuOpen(false)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="ปิดเมนู"
                      aria-label="ปิดเมนู"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Drawer Navigation List */}
                  <div className="p-4 sm:p-5 space-y-2">
                    {NAV_ITEMS.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => { 
                            setActiveTab(tab.id as any); 
                            setSideMenuOpen(false); 
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-left transition-all cursor-pointer border ${
                            isActive 
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' 
                              : 'bg-white text-slate-800 border-slate-100 hover:bg-emerald-50/70 hover:border-emerald-200/80 hover:text-emerald-900'
                          }`}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-700'}`} />
                          <span className="text-xs sm:text-sm font-bold font-prompt flex-1">{tab.label}</span>
                          {isActive && <ChevronRight className="w-4 h-4 text-emerald-200 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-4 sm:p-5 border-t border-slate-100 text-center bg-slate-50/70">
                  <p className="text-xs font-bold font-prompt text-slate-700">
                    กองทรัพยากรมนุษย์
                  </p>
                  <p className="text-[10px] font-prompt text-slate-500 mt-0.5">
                    สำนักงานอธิการบดี มหาวิทยาลัยศิลปากร
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
