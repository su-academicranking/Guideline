import React, { useState, useMemo, useEffect } from 'react';
import { KnowledgeItem, extractFileLink, formatThaiFullDate, isNewItem, parseDateForSort } from '../types';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  Tag, 
  HelpCircle, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Filter,
  X,
  Sparkles,
  FileCheck2,
  MessageSquareText,
  Layers
} from 'lucide-react';

interface KnowledgeBaseProps {
  items: KnowledgeItem[];
  categories: string[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedItem: KnowledgeItem | null;
  onSelectItem: (item: KnowledgeItem) => void;
  bookmarks: KnowledgeItem[];
  onToggleBookmark: (item: KnowledgeItem) => void;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({
  items = [],
  categories = [],
  searchQuery,
  setSearchQuery,
  onSelectItem
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ทั้งหมด');

  // Pagination states for Section 1 (Circular / Inquiries)
  const [circularPage, setCircularPage] = useState<number>(1);
  const [circularPageSize, setCircularPageSize] = useState<number>(5);

  // Pagination states for Section 2 (Q&A)
  const [qaPage, setQaPage] = useState<number>(1);
  const [qaPageSize, setQaPageSize] = useState<number>(5);

  // 1. Sort all items from NEWEST to OLDEST by date
  const sortedAllItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = parseDateForSort(a.Date);
      const dateB = parseDateForSort(b.Date);
      if (dateB !== dateA) {
        return dateB - dateA; // Newest first
      }
      return (b.rowNum || 0) - (a.rowNum || 0);
    });
  }, [items]);

  // 2. Filter by search query and category
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedAllItems.filter(item => {
      const matchCategory = activeCategory === 'ทั้งหมด' || item.Category === activeCategory;
      const matchQuery = !q || 
        (item.Title && item.Title.toLowerCase().includes(q)) ||
        (item.Details && item.Details.toLowerCase().includes(q)) ||
        (item.Category && item.Category.toLowerCase().includes(q)) ||
        (item.Date && item.Date.includes(q));
      
      return matchCategory && matchQuery;
    });
  }, [sortedAllItems, activeCategory, searchQuery]);

  // Reset pagination when search or category filter changes
  useEffect(() => {
    setCircularPage(1);
    setQaPage(1);
  }, [searchQuery, activeCategory]);

  // 3. Separate into 2 main sections:
  // Section 1: หนังสือเวียน / ตอบข้อหารือ
  const circularItems = useMemo(() => {
    return filteredItems.filter(item => {
      const cat = (item.Category || '').toLowerCase();
      return cat.includes('หนังสือเวียน') || cat.includes('ตอบข้อหารือ') || cat.includes('หนังสือ') || cat.includes('เวียน');
    });
  }, [filteredItems]);

  // Section 2: Q&A (ข้อคำถามและคำตอบ)
  const qaItems = useMemo(() => {
    return filteredItems.filter(item => {
      const cat = (item.Category || '').toLowerCase();
      const isCircular = cat.includes('หนังสือเวียน') || cat.includes('ตอบข้อหารือ') || cat.includes('หนังสือ') || cat.includes('เวียน');
      return !isCircular;
    });
  }, [filteredItems]);

  // Paginated Items for Section 1
  const circularTotalPages = Math.ceil(circularItems.length / circularPageSize) || 1;
  const paginatedCircularItems = useMemo(() => {
    const start = (circularPage - 1) * circularPageSize;
    return circularItems.slice(start, start + circularPageSize);
  }, [circularItems, circularPage, circularPageSize]);

  // Paginated Items for Section 2
  const qaTotalPages = Math.ceil(qaItems.length / qaPageSize) || 1;
  const paginatedQaItems = useMemo(() => {
    const start = (qaPage - 1) * qaPageSize;
    return qaItems.slice(start, start + qaPageSize);
  }, [qaItems, qaPage, qaPageSize]);

  // Render an individual Knowledge Item Card
  const renderItemCard = (item: KnowledgeItem, idx: number) => {
    const docLink = extractFileLink(item);

    return (
      <div
        key={`${item.Category}-${item.rowNum || idx}-${item.Title}`}
        className="bg-white rounded-xl border border-slate-200/90 hover:border-emerald-400 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
      >
        <div className="flex-1 space-y-1.5 min-w-0 font-sarabun">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center text-[10px] sm:text-[11px] font-sarabun font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-md shadow-2xs">
              <Tag className="w-3 h-3 mr-1 text-emerald-600 flex-shrink-0" />
              <span>{item.Category || 'หลักเกณฑ์'}</span>
            </span>

            {item.Date && (
              <span className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 font-sarabun font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatThaiFullDate(item.Date)}</span>
              </span>
            )}

            {isNewItem(item.Date) && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold font-sarabun bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs animate-pulse tracking-wide uppercase">
                <Sparkles className="w-2.5 h-2.5" />
                <span>NEW</span>
              </span>
            )}
          </div>

          {/* Title in font-sarabun bold with color #2b3c56 */}
          <h4 
            onClick={() => onSelectItem(item)}
            className="text-sm sm:text-base font-bold font-sarabun text-[#2b3c56] hover:text-emerald-700 transition-colors cursor-pointer leading-snug break-words"
          >
            {item.Title}
          </h4>
        </div>

        {/* Action Buttons arranged neatly at same position */}
        <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
          {docLink && (
            <a
              href={docLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-sarabun font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดูเอกสาร</span>
            </a>
          )}

          <button
            onClick={() => onSelectItem(item)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#4D80CC] hover:text-[#3865a7] border border-slate-200 hover:border-[#4D80CC]/40 rounded-lg text-xs font-sarabun font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
          >
            <span>รายละเอียด</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    );
  };

  // Reusable Section Pagination Component
  const renderPagination = (
    totalItems: number,
    currentPage: number,
    pageSize: number,
    onPageChange: (p: number) => void,
    onPageSizeChange: (s: number) => void,
    accentColor: 'sky' | 'emerald'
  ) => {
    if (totalItems === 0) return null;

    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startIdx = (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(currentPage * pageSize, totalItems);

    const activeBg = accentColor === 'sky' 
      ? 'bg-sky-700 text-white border-sky-700 shadow-2xs' 
      : 'bg-emerald-700 text-white border-emerald-700 shadow-2xs';

    const hoverText = accentColor === 'sky' 
      ? 'hover:bg-sky-50 hover:text-sky-800 hover:border-sky-300' 
      : 'hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300';

    return (
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sarabun">
        {/* Left: Item Range & Page Size Selector */}
        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
          <span className="text-slate-600">
            แสดง <strong className="font-bold text-slate-800">{startIdx}-{endIdx}</strong> จากทั้งหมด <strong className="font-bold text-slate-800">{totalItems}</strong> รายการ
          </span>

          <div className="flex items-center gap-1.5 text-slate-500 pl-2 sm:border-l border-slate-200">
            <span>แสดงต่อหน้า:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Right: Page Buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="หน้าก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;

                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                    <button
                      onClick={() => onPageChange(p)}
                      className={`min-w-[32px] h-8 px-2 rounded-lg font-bold transition-all cursor-pointer border ${
                        currentPage === p
                          ? activeBg
                          : `bg-white text-slate-700 border-slate-200 ${hoverText}`
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="หน้าถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Filter Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-sarabun text-emerald-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>คลังความรู้ ข้อคำถาม & หนังสือเวียน</span>
            </h3>
            <p className="text-xs font-sarabun text-slate-500 mt-1">
              เรียงลำดับจากข้อมูลล่าสุดไปเก่า แบ่งเป็น 2 ส่วนหลัก: หนังสือเวียนคณะ/ตอบข้อหารือ และคำถามที่พบบ่อย (Q&A)
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-sarabun text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <span>พบทั้งหมด <strong className="text-emerald-700 font-bold font-sarabun">{filteredItems.length}</strong> รายการ</span>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์คำเพื่อค้นหาหนังสือเวียน, ข้อหารือ, ข้อคำถาม Q&A หรือรายละเอียด..."
              className="w-full pl-8 sm:pl-9 pr-8 sm:pr-9 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-sarabun text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="ล้างคำค้นหา"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Dropdown */}
        <div className="pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <label htmlFor="kb-category-select" className="text-xs font-bold font-sarabun text-emerald-900">
                เลือกหมวดหมู่รายการ:
              </label>
            </div>

            <div className="relative w-full sm:w-80">
              <select
                id="kb-category-select"
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full pl-3.5 pr-10 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs sm:text-sm font-sarabun font-semibold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs appearance-none cursor-pointer truncate"
              >
                <option value="ทั้งหมด">หมวดหมู่ทั้งหมด (แสดงทั้ง 2 ส่วน)</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat} className="font-sarabun text-slate-800">
                    {cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-emerald-600">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Content: Divided into 2 Explicit Sections */}
      {filteredItems.length > 0 ? (
        <div className="space-y-8">
          
          {/* SECTION 1: หนังสือเวียนคณะ / ตอบข้อหารือ */}
          {(activeCategory === 'ทั้งหมด' || activeCategory.includes('หนังสือเวียน') || activeCategory.includes('ตอบข้อหารือ')) && (
            <div className="space-y-3.5">
              {/* Section 1 Header */}
              <div className="bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-sky-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-sky-200 border border-white/20 flex-shrink-0">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold font-sarabun text-white">
                      หนังสือเวียนคณะ / ตอบข้อหารือ
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-sarabun text-sky-100 bg-black/20 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
                  <span>{circularItems.length} รายการ</span>
                </div>
              </div>

              {/* Section 1 Items */}
              {paginatedCircularItems.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {paginatedCircularItems.map((item, idx) => renderItemCard(item, idx))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-400 text-xs font-sarabun">
                  ไม่พบรายการหนังสือเวียน/ตอบข้อหารือที่ตรงกับคำค้นหา
                </div>
              )}

              {/* Section 1 Pagination */}
              {circularItems.length > 0 && renderPagination(
                circularItems.length,
                circularPage,
                circularPageSize,
                setCircularPage,
                setCircularPageSize,
                'sky'
              )}
            </div>
          )}

          {/* SECTION 2: ข้อคำถามและคำตอบ (Q&A) */}
          {(activeCategory === 'ทั้งหมด' || activeCategory.includes('Q&A') || activeCategory.includes('คำถาม')) && (
            <div className="space-y-3.5">
              {/* Section 2 Header */}
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-emerald-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 flex-shrink-0">
                    <MessageSquareText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold font-sarabun text-white">
                      ข้อคำถามและคำตอบ (Q&A)
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-sarabun text-emerald-100 bg-black/20 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
                  <span>{qaItems.length} รายการ</span>
                </div>
              </div>

              {/* Section 2 Items */}
              {paginatedQaItems.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {paginatedQaItems.map((item, idx) => renderItemCard(item, idx))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-400 text-xs font-sarabun">
                  ไม่พบข้อคำถาม Q&A ที่ตรงกับคำค้นหา
                </div>
              )}

              {/* Section 2 Pagination */}
              {qaItems.length > 0 && renderPagination(
                qaItems.length,
                qaPage,
                qaPageSize,
                setQaPage,
                setQaPageSize,
                'emerald'
              )}
            </div>
          )}

        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 font-sarabun">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700">ไม่พบข้อคำถามหรือหลักเกณฑ์ที่ค้นหา</h4>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('ทั้งหมด'); }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            ล้างตัวกรองและคำค้นหา
          </button>
        </div>
      )}

    </div>
  );
};

