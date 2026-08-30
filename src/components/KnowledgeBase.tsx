import React, { useState, useMemo } from 'react';
import { KnowledgeItem, extractFileLink, formatThaiFullDate, isNewItem } from '../types';
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
  Sparkles
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
  onSelectItem,
  bookmarks,
  onToggleBookmark
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ทั้งหมด');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCategory = activeCategory === 'ทั้งหมด' || item.Category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = !q || 
        (item.Title && item.Title.toLowerCase().includes(q)) ||
        (item.Details && item.Details.toLowerCase().includes(q)) ||
        (item.Category && item.Category.toLowerCase().includes(q));
      
      return matchCategory && matchQuery;
    });
  }, [items, activeCategory, searchQuery]);

  // Reset page when search or category changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const isBookmarked = (item: KnowledgeItem) => {
    return bookmarks.some(b => b.Title === item.Title && b.Category === item.Category);
  };

  const getFileBadge = (url?: string) => {
    if (!url) return null;
    const lower = url.toLowerCase();
    if (lower.includes('.pdf')) {
      return { label: 'PDF', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
    }
    if (lower.includes('.doc')) {
      return { label: 'Word', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    if (lower.includes('.xls')) {
      return { label: 'Excel', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    return { label: 'ลิงก์เอกสาร', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        return `${d}/${m}/${Number(y) + 543}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Filter Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-sarabun text-emerald-900">
              <span>คลังความรู้ ข้อคำถาม & หนังสือเวียน</span>
            </h3>
            <p className="text-xs font-sarabun text-slate-500 mt-1">
              รวมคำถามที่พบบ่อย (Q&A) และหนังสือตอบข้อหารือเกี่ยวกับการเสนอกำหนดตำแหน่งทางวิชาการ
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
              placeholder="พิมพ์คำเพื่อค้นหาข้อคำถาม Q&A, หัวข้อ หรือรายละเอียดคลังความรู้..."
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
                <option value="ทั้งหมด">หมวดหมู่ทั้งหมด</option>
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

      {/* List Layout of Knowledge Items */}
      {paginatedItems.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {paginatedItems.map((item, idx) => {
            const docLink = extractFileLink(item);

            return (
              <div
                key={idx}
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
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-700">ไม่พบข้อคำถามหรือหลักเกณฑ์ที่ค้นหา</h4>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('ทั้งหมด'); }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
          >
            ล้างตัวกรอง
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            หน้า <strong className="text-slate-800">{currentPage}</strong> จาก <strong className="text-slate-800">{totalPages}</strong>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
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
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg font-medium transition-colors cursor-pointer ${
                        currentPage === p
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
