import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppsScriptData, KnowledgeItem, FormItem } from './types';
import { INITIAL_APP_DATA } from './data/initialData';
import { fetchLiveAppData, getStoredAppData, APPS_SCRIPT_URL } from './services/dataSync';
import { Header } from './components/Header';
import { HeroSlider } from './components/HeroSlider';
import { KnowledgeBase } from './components/KnowledgeBase';
import { FormsHub } from './components/FormsHub';
import { BranchLookup } from './components/BranchLookup';
import { DetailModal } from './components/DetailModal';
import { BookmarksModal } from './components/BookmarksModal';
import { ContactFooter } from './components/ContactFooter';
import { LoadingScreen } from './components/LoadingScreen';
import { ScrollNavigation } from './components/ScrollNavigation';
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  CheckCircle2,
  Sparkles,
  BookOpen,
  FileText,
  GraduationCap,
  ArrowRight,
  Code2,
  HelpCircle,
  ChevronRight,
  Home as HomeIcon,
  Search,
  Eye,
  FileCheck
} from 'lucide-react';

export default function App() {
  const [data, setData] = useState<AppsScriptData>(() => {
    // 1. Check window.initialData if injected
    if (typeof window !== 'undefined' && (window as any).initialData) {
      try {
        return (window as any).initialData;
      } catch {}
    }
    // 2. Check localStorage cached data
    try {
      const saved = localStorage.getItem('su_hr_cached_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.branches || parsed.formsData || parsed.settings)) {
          return parsed;
        }
      }
    } catch {}
    // 3. Fallback to bundled data
    return INITIAL_APP_DATA;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Active Tab: 'home' | 'knowledge' | 'forms' | 'branches' | 'about'
  const [activeTab, setActiveTab] = useState<'home' | 'knowledge' | 'forms' | 'branches' | 'about'>('home');

  // Search Query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Detail Modal
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);

  // Bookmarks state (saved to localStorage)
  const [bookmarks, setBookmarks] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('su_hr_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bookmarksModalOpen, setBookmarksModalOpen] = useState<boolean>(false);

  // Listen & Sync URL Parameter (?page=home, ?page=knowledge, ?page=forms, ?page=branches)
  useEffect(() => {
    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const pageParam = params.get('page');
        if (pageParam && ['home', 'knowledge', 'forms', 'branches', 'about'].includes(pageParam)) {
          setActiveTab(pageParam as any);
        }
      } catch (e) {
        console.error("Failed to parse URL query parameters", e);
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Always scroll to top when changing activeTab / switching menus
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [activeTab]);

  const handleTabChange = (tab: 'home' | 'knowledge' | 'forms' | 'branches' | 'about') => {
    setActiveTab(tab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('page', tab);
      window.history.pushState({}, '', url.toString());
    } catch (e) {
      console.error("Failed to update URL parameters", e);
    }
  };

  // Save bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('su_hr_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.error("Failed to save bookmarks to localStorage", e);
    }
  }, [bookmarks]);

  // Google Apps Script Web App URL connected to Google Sheets
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxLHp1LBXBj4QYgIUq76-fie06_DscaOCbGcirvk1b44fOVyoFmVBungMUTx7ZRua8obg/exec";

  // Fetch API & Sync Real-Time Stats with Google Sheet (Supports both Fullstack Server and Static GitHub Pages)
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    setError(null);

    // 1. Send live ping to Google Apps Script / Google Sheet to register current page visit
    try {
      fetch(`${APPS_SCRIPT_URL}?t=${Date.now()}`, {
        mode: 'no-cors',
        cache: 'no-store'
      }).catch(() => {});
    } catch {}

    try {
      // 2. Fetch live data across all available endpoints (Express server, Direct Google Apps Script, CORS proxies)
      const latestData = await fetchLiveAppData(forceRefresh);
      if (latestData) {
        setData(latestData);
      }
    } catch (err) {
      console.warn("Could not sync live data from Google Sheet, using cached/initial data", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }

    // 3. Track session visit for immediate UI response
    try {
      const hasCountedSession = sessionStorage.getItem('su_hr_visit_recorded');
      if (!hasCountedSession) {
        sessionStorage.setItem('su_hr_visit_recorded', '1');
        setData(prev => {
          if (!prev) return prev;
          const baseTotal = typeof prev.totalVisits === 'number' ? prev.totalVisits : 0;
          const baseMonth = typeof prev.thisMonthVisits === 'number' ? prev.thisMonthVisits : 0;
          const updated = {
            ...prev,
            totalVisits: baseTotal + 1,
            thisMonthVisits: baseMonth + 1
          };
          try {
            localStorage.setItem('su_hr_cached_data', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle Bookmark
  const handleToggleBookmark = (item: any) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.Title === item.Title && (b.Category === item.Category || b.Level1 === item.Level1));
      if (exists) {
        return prev.filter(b => !(b.Title === item.Title && (b.Category === item.Category || b.Level1 === item.Level1)));
      } else {
        return [...prev, item];
      }
    });
  };

  const handleRemoveBookmark = (item: any) => {
    setBookmarks(prev => prev.filter(b => !(b.Title === item.Title && (b.Category === item.Category || b.Level1 === item.Level1))));
  };

  const handleClearBookmarks = () => {
    setBookmarks([]);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFE] text-slate-800 font-sans flex flex-col selection:bg-violet-500 selection:text-white">
      
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        siteName={data?.settings?.SiteName || 'กองทรัพยากรมนุษย์'}
        subSiteName={data?.settings?.SubSiteName || 'สำนักงานอธิการบดี มหาวิทยาลัยศิลปากร'}
        logoUrl={data?.settings?.LogoURL || "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Silpakorn_University.svg"}
        bookmarksCount={bookmarks.length}
        onOpenBookmarks={() => setBookmarksModalOpen(true)}
        onRefresh={() => fetchData(true)}
        isRefreshing={isRefreshing}
        lastUpdated={data?.lastUpdated}
        totalVisits={data?.totalVisits}
        thisMonthVisits={data?.thisMonthVisits}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Loading Overlay State */}
      <AnimatePresence>
        {loading && (
          <LoadingScreen
            logoUrl={data?.settings?.LogoURL}
            siteName={data?.settings?.SiteName}
            subSiteName={data?.settings?.SubSiteName}
          />
        )}
      </AnimatePresence>

      {error ? (
        <div className="max-w-2xl mx-auto my-12 p-6 bg-white border border-rose-200 rounded-2xl shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">ไม่สามารถโหลดข้อมูลได้</h3>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
          </div>
          <button
            onClick={() => fetchData(true)}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>ลองใหม่อีกครั้ง</span>
          </button>
        </div>
      ) : !loading && (
        <main className="flex-1">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Active Tab == 'home' View */}
              {activeTab === 'home' && (
                <div className="space-y-8 pb-12">
                  {/* Hero Banner Section (เฉพาะหน้าแรก) */}
                  <HeroSlider
                    heroTitle={data?.settings?.HeroTitle || 'Guideline ตำแหน่งทางวิชาการ'}
                    heroSubTitle={data?.settings?.HeroSubTitle || 'รวมหลักเกณฑ์ ข้อคำถาม และหนังสือเวียนคณะ/หนังสือตอบข้อหารือ'}
                    sliderItems={data?.slider || []}
                    itemsCount={data?.items?.length || 0}
                    formsCount={data?.formsData?.length || 0}
                    branchesCount={data?.branches?.length || 0}
                    totalVisits={data?.totalVisits || 0}
                    onExploreClick={() => handleTabChange('knowledge')}
                    onFormsClick={() => handleTabChange('forms')}
                  />

                  {/* Home Navigation Hub Cards */}
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* 3 Main Action Modules */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      
                      {/* Card 1: Knowledge Base */}
                      <div 
                        onClick={() => handleTabChange('knowledge')}
                        className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                      >
                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-50 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
                        <div className="space-y-4 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold font-prompt text-slate-900 group-hover:text-emerald-800 transition-colors">
                              คลังความรู้ & Q&A
                            </h3>
                          </div>
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-prompt font-bold text-emerald-700 group-hover:text-emerald-900">
                          <span>เปิดหน้าคลังความรู้</span>
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                      {/* Card 2: Forms Hub */}
                      <div 
                        onClick={() => handleTabChange('forms')}
                        className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                      >
                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-50 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
                        <div className="space-y-4 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold font-prompt text-slate-900 group-hover:text-emerald-800 transition-colors">
                              หลักเกณฑ์ & แบบฟอร์ม
                            </h3>
                          </div>
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-prompt font-bold text-emerald-700 group-hover:text-emerald-900">
                          <span>เปิดหน้าหลักเกณฑ์</span>
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                      {/* Card 3: Branch Lookup */}
                      <div 
                        onClick={() => handleTabChange('branches')}
                        className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                      >
                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-50 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
                        <div className="space-y-4 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <GraduationCap className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold font-prompt text-slate-900 group-hover:text-emerald-800 transition-colors">
                              สาขาวิชาที่ ก.พ.อ. กำหนด
                            </h3>
                          </div>
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-prompt font-bold text-emerald-700 group-hover:text-emerald-900">
                          <span>ค้นหาสาขาวิชา</span>
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* Active Tab Views (แยกจากหน้าแรก) */}
              {activeTab !== 'home' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                  
                  {/* Tab 1: Knowledge Base Q&A */}
                  {activeTab === 'knowledge' && (
                    <KnowledgeBase
                      items={data?.items || []}
                      categories={data?.categories || []}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      selectedItem={selectedItem}
                      onSelectItem={(item) => setSelectedItem(item)}
                      bookmarks={bookmarks}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  )}

                  {/* Tab 2: Forms & Guidelines */}
                  {activeTab === 'forms' && (
                    <FormsHub
                      forms={data?.formsData || []}
                      formCatsMeta={data?.formCatsMeta || []}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      bookmarks={bookmarks}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  )}

                  {/* Tab 3: Academic Branch Lookup */}
                  {activeTab === 'branches' && (
                    <BranchLookup
                      branches={data?.branches || []}
                      branchConfigs={data?.branchConfigs || []}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                    />
                  )}

                  {/* Tab 4: About & Contact View */}
                  {activeTab === 'about' && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                        <div className="flex items-center space-x-4 border-b border-slate-100 pb-6">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 p-2 flex items-center justify-center border border-slate-200">
                            <img
                              src={data?.settings?.LogoURL || "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Silpakorn_University.svg"}
                              alt="Silpakorn Logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 font-prompt">
                              {data?.settings?.SiteName || 'กองทรัพยากรมนุษย์'}
                            </h3>
                            <p className="text-sm text-slate-500 font-sarabun">
                              {data?.settings?.SubSiteName || 'สำนักงานอธิการบดี มหาวิทยาลัยศิลปากร'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200">
                            <h4 className="text-sm font-bold font-prompt text-slate-900 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-violet-600" />
                              <span>เกี่ยวกับระบบ Guideline ตำแหน่งทางวิชาการ</span>
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed font-sarabun font-light">
                              ระบบจัดเก็บและเผยแพร่ข้อมูลหลักเกณฑ์ แบบฟอร์มเสนอขอแต่งตั้งให้ดำรงตำแหน่งทางวิชาการ (ผู้ช่วยศาสตราจารย์, รองศาสตราจารย์, ศาสตราจารย์) และตอบข้อหารือสำหรับบุคลากรสายวิชาการ มหาวิทยาลัยศิลปากร
                            </p>
                          </div>

                          <div className="space-y-3 bg-violet-50/50 p-5 rounded-xl border border-violet-200/80">
                            <h4 className="text-sm font-bold font-prompt text-violet-950 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-violet-600" />
                              <span>สถานที่ติดต่อ & สอบถามเพิ่มเติม</span>
                            </h4>
                            <p className="text-xs text-violet-900 leading-relaxed font-sarabun whitespace-pre-line">
                              {data?.contact?.Address || 'งานพัฒนาทรัพยากรมนุษย์ กองทรัพยากรมนุษย์ สำนักงานอธิการบดี (ตลิ่งชัน) มหาวิทยาลัยศิลปากร'}
                            </p>
                          </div>
                        </div>

                        {/* Navigation Shortcuts */}
                        <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                          <button
                            onClick={() => handleTabChange('knowledge')}
                            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer hover:bg-slate-800"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>เข้าสู่คลังความรู้ & Q&A</span>
                          </button>

                          <button
                            onClick={() => handleTabChange('forms')}
                            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer hover:bg-emerald-700"
                          >
                            <FileText className="w-4 h-4" />
                            <span>เข้าสู่หน้าแบบฟอร์ม</span>
                          </button>

                          <button
                            onClick={() => handleTabChange('branches')}
                            className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer hover:bg-slate-200"
                          >
                            <GraduationCap className="w-4 h-4" />
                            <span>ค้นหาสาขาวิชา (ก.พ.อ.)</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </main>
      )}

      {/* Footer */}
      <ContactFooter
        contact={data?.contact}
        links={data?.links}
        siteName={data?.settings?.SiteName || 'กองทรัพยากรมนุษย์'}
        subSiteName={data?.settings?.SubSiteName || 'สำนักงานอธิการบดี มหาวิทยาลัยศิลปากร'}
        totalVisits={data?.totalVisits || 0}
        thisMonthVisits={data?.thisMonthVisits || 0}
        logoUrl={data?.settings?.LogoURL}
      />

      {/* Item Detail Modal */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          isBookmarked={bookmarks.some(b => b.Title === selectedItem.Title && b.Category === selectedItem.Category)}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      {/* Saved Bookmarks Modal */}
      <BookmarksModal
        isOpen={bookmarksModalOpen}
        onClose={() => setBookmarksModalOpen(false)}
        bookmarks={bookmarks}
        onRemoveBookmark={handleRemoveBookmark}
        onClearAll={handleClearBookmarks}
        onSelectItem={(item) => setSelectedItem(item)}
      />

      {/* Page Scroll Controls (Scroll Up / Scroll Down) */}
      <ScrollNavigation />

    </div>
  );
}

