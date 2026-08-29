import React, { useState, useMemo } from 'react';
import { AcademicBranch, BranchConfig } from '../types';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Layers, 
  BookOpen,
  Hash,
  CheckCircle2
} from 'lucide-react';

interface BranchLookupProps {
  branches: AcademicBranch[];
  branchConfigs: BranchConfig[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const BranchLookup: React.FC<BranchLookupProps> = ({
  branches = [],
  branchConfigs = [],
  searchQuery,
  setSearchQuery
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('ทั้งหมด');
  const [fieldSearch, setFieldSearch] = useState<string>('');
  const [subfieldSearch, setSubfieldSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 25;

  // Extract Unique Groups
  const uniqueGroups = useMemo(() => {
    return Array.from(new Set(branches.map(b => b.Group).filter(Boolean)));
  }, [branches]);

  // Filter branches
  const filteredBranches = useMemo(() => {
    return branches.filter(b => {
      const matchGroup = selectedGroup === 'ทั้งหมด' || b.Group === selectedGroup;
      
      const q = searchQuery.trim().toLowerCase();
      const matchGlobal = !q ||
        (b.Group && b.Group.toLowerCase().includes(q)) ||
        (b.Field && b.Field.toLowerCase().includes(q)) ||
        (b.Subfield && b.Subfield.toLowerCase().includes(q)) ||
        (b.Branch && b.Branch.toLowerCase().includes(q));

      const matchField = !fieldSearch.trim() || (b.Field && b.Field.toLowerCase().includes(fieldSearch.toLowerCase()));
      const matchSubfield = !subfieldSearch.trim() || (b.Subfield && b.Subfield.toLowerCase().includes(subfieldSearch.toLowerCase()));

      return matchGroup && matchGlobal && matchField && matchSubfield;
    });
  }, [branches, selectedGroup, searchQuery, fieldSearch, subfieldSearch]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [selectedGroup, searchQuery, fieldSearch, subfieldSearch]);

  // Pagination
  const totalPages = Math.ceil(filteredBranches.length / pageSize) || 1;
  const paginatedBranches = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBranches.slice(start, start + pageSize);
  }, [filteredBranches, page, pageSize]);

  // Group Badge Color
  const getGroupBadgeClass = (group: string) => {
    const colors = [
      'bg-indigo-50 text-indigo-800 border-indigo-200',
      'bg-emerald-50 text-emerald-800 border-emerald-200',
      'bg-purple-50 text-purple-800 border-purple-200',
      'bg-amber-50 text-amber-800 border-amber-200',
      'bg-rose-50 text-rose-800 border-rose-200',
      'bg-cyan-50 text-cyan-800 border-cyan-200'
    ];
    const idx = uniqueGroups.indexOf(group);
    return colors[idx % colors.length] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-4 font-sarabun">
      
      {/* Title & Group Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-2xs">
        <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-sarabun text-emerald-900 leading-tight">
              <span>ค้นหาสาขาวิชาในการขอกำหนดตำแหน่งทางวิชาการ</span>
            </h3>
            <p className="text-[11px] sm:text-xs font-sarabun text-slate-500 mt-0.5">
              บัญชีรายชื่อสาขาวิชา อนุสาขาวิชา และแขนงวิชาสำหรับการเสนอขอกำหนดตำแหน่งทางวิชาการ
            </p>
          </div>

          <div className="flex items-center self-start sm:self-auto text-xs font-sarabun text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
            <span>พบทั้งหมด <strong className="text-emerald-700 font-bold font-sarabun">{filteredBranches.length}</strong> สาขา</span>
          </div>
        </div>

        {/* Reference Config Note */}
        {branchConfigs.length > 0 && (
          <div className="mt-3 p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl text-[11px] sm:text-xs space-y-1.5 text-slate-700">
            {branchConfigs.map((cfg, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-slate-900 mr-1.5">{cfg.Title}:</span>
                  <span className="whitespace-pre-line text-slate-600">{cfg.Content}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Group Selector Dropdown & Pills */}
        <div className="pt-3 space-y-2.5">
          {/* Dropdown Select (Optimized for Mobile & Desktop) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <label htmlFor="group-select" className="text-xs font-bold font-sarabun text-emerald-900">
                เลือกกลุ่มวิชา:
              </label>
            </div>

            <div className="relative w-full sm:w-72">
              <select
                id="group-select"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-sarabun font-semibold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs appearance-none cursor-pointer truncate"
              >
                <option value="ทั้งหมด">กลุ่มวิชาทั้งหมด</option>
                {uniqueGroups.map((grp, idx) => (
                  <option key={idx} value={grp} className="font-sarabun text-slate-800">
                    {grp}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-emerald-600">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Quick Pill Filter Tabs for Large Screens */}
          <div className="hidden sm:flex flex-wrap gap-1.5 items-center pt-0.5">
            <button
              onClick={() => setSelectedGroup('ทั้งหมด')}
              className={`px-3 py-1 rounded-full text-xs font-sarabun font-medium transition-all cursor-pointer ${
                selectedGroup === 'ทั้งหมด'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              กลุ่มวิชาทั้งหมด
            </button>

            {uniqueGroups.map((grp, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedGroup(grp)}
                className={`px-3 py-1 rounded-full text-xs font-sarabun font-medium transition-all cursor-pointer ${
                  selectedGroup === grp
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input Bar for Field / Subfield */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              placeholder="ค้นหาชื่อสาขาวิชา (รหัส 4 หลัก e.g. 9164)..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sarabun text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={subfieldSearch}
              onChange={(e) => setSubfieldSearch(e.target.value)}
              placeholder="ค้นหาอนุสาขาวิชา (รหัส 6 หลัก e.g. 916403)..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sarabun text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Desktop Table View & Mobile Cards View */}
      {paginatedBranches.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs font-sarabun">
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sarabun">
              <thead>
                <tr className="bg-emerald-900 text-white font-semibold uppercase tracking-wider font-sarabun">
                  <th className="py-3 px-3.5 w-36 font-sarabun">กลุ่มวิชา</th>
                  <th className="py-3 px-3.5 w-60 font-sarabun">สาขาวิชา (4 หลัก)</th>
                  <th className="py-3 px-3.5 font-sarabun">อนุสาขาวิชา (6 หลัก)</th>
                  <th className="py-3 px-3.5 w-32 font-sarabun">แขนงวิชา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-sarabun">
                {paginatedBranches.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors font-sarabun">
                    <td className="py-2.5 px-3.5 font-sarabun">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border font-sarabun ${getGroupBadgeClass(b.Group)}`}>
                        {b.Group}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold font-sarabun" style={{ color: '#4D80CC' }}>
                      {b.Field}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700 font-normal font-sarabun">
                      {b.Subfield}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500 font-sarabun text-[11px]">
                      {b.Branch || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-slate-100 font-sarabun">
            {paginatedBranches.map((b, idx) => (
              <div key={idx} className="p-3 space-y-1.5 hover:bg-emerald-50/20 transition-colors font-sarabun">
                <div className="flex items-center justify-between font-sarabun">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border font-sarabun ${getGroupBadgeClass(b.Group)}`}>
                    {b.Group}
                  </span>
                </div>

                <div className="space-y-1 font-sarabun">
                  <div className="text-xs font-bold font-sarabun leading-snug" style={{ color: '#4D80CC' }}>
                    <span className="text-slate-500 font-normal mr-1 font-sarabun">สาขาวิชา:</span>
                    {b.Field}
                  </div>
                  <div className="text-xs text-slate-700 font-sarabun leading-snug">
                    <span className="text-slate-500 font-normal mr-1 font-sarabun">อนุสาขาวิชา:</span>
                    {b.Subfield}
                  </div>
                  {b.Branch && b.Branch !== '-' && (
                    <div className="text-[11px] text-slate-500 font-sarabun leading-snug">
                      <span className="text-slate-400 mr-1 font-sarabun">แขนงวิชา:</span>
                      {b.Branch}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-700">ไม่พบสาขาวิชาที่ตรงกับเงื่อนไข</h4>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกกลุ่มวิชาอื่น</p>
          <button
            onClick={() => { setSelectedGroup('ทั้งหมด'); setFieldSearch(''); setSubfieldSearch(''); setSearchQuery(''); }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            หน้า <strong className="text-slate-800">{page}</strong> จาก <strong className="text-slate-800">{totalPages}</strong>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;

                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg font-medium transition-colors cursor-pointer ${
                        page === p ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
