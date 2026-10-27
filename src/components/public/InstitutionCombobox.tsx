/**
 * 5TOT ĐHĐN — Searchable Participating Institution Combobox
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 14 Sections 32–39, 62, 64–68, 94:
 * - Searchable combobox loaded from isolated registry source.
 * - Full keyboard navigation (ArrowDown, ArrowUp, Enter, Escape).
 * - Accent-insensitive Vietnamese search (full name, partial name, common keyword).
 * - Supports long official names (up to 2 lines without ugly truncation).
 * - Distinct states for Loading, Load Failure ("Chưa thể tải danh sách trường." + [Thử lại]),
 *   and No Match ("Không tìm thấy đơn vị phù hợp." / "Hãy kiểm tra lại tên trường.").
 * - Never allows Students to create arbitrary institutions.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  Building2,
  Loader2,
} from 'lucide-react';
import {
  ParticipatingInstitution,
  fetchParticipatingInstitutions,
  filterInstitutionsByQuery,
} from '../../demo/fixtures/institutionRegistry';

export interface InstitutionComboboxProps {
  selectedInstitution: ParticipatingInstitution | null;
  onSelect: (institution: ParticipatingInstitution | null) => void;
  error?: string;
  disabled?: boolean;
  /** Optional QA overrides for Primary Screenshots C & E */
  forceOpen?: boolean;
  initialSearchQuery?: string;
  forceLoadError?: boolean;
  forceLoading?: boolean;
  onRetryLoadError?: () => void;
}

export const InstitutionCombobox: React.FC<InstitutionComboboxProps> = ({
  selectedInstitution,
  onSelect,
  error,
  disabled = false,
  forceOpen = false,
  initialSearchQuery = '',
  forceLoadError = false,
  forceLoading = false,
  onRetryLoadError,
}) => {
  const [institutions, setInstitutions] = useState<ParticipatingInstitution[]>(
    []
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasLoadError, setHasLoadError] = useState<boolean>(false);

  const [isOpen, setIsOpen] = useState<boolean>(forceOpen);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Sync QA preset props when switched
  useEffect(() => {
    setIsOpen(forceOpen);
  }, [forceOpen]);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  // Load registry from isolated data source
  const loadRegistry = async (simulateError = false) => {
    setIsLoading(true);
    setHasLoadError(false);
    try {
      const data = await fetchParticipatingInstitutions({
        simulateDelayMs: 120,
        simulateError,
      });
      setInstitutions(data);
      setIsLoading(false);
    } catch {
      setHasLoadError(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRegistry(forceLoadError);
  }, [forceLoadError]);

  const effectiveLoading = forceLoading || isLoading;
  const effectiveError = forceLoadError || hasLoadError;

  const filteredInstitutions = useMemo(
    () => filterInstitutionsByQuery(institutions, searchQuery),
    [institutions, searchQuery]
  );

  // Keep highlighted index in bounds
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenDropdown = () => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleSelectOption = (inst: ParticipatingInstitution) => {
    onSelect(inst);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchQuery('');
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRetryLoadError) {
      onRetryLoadError();
    }
    loadRegistry(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    if (isOpen && !effectiveLoading && !effectiveError) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          filteredInstitutions.length > 0
            ? (prev + 1) % filteredInstitutions.length
            : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          filteredInstitutions.length > 0
            ? (prev - 1 + filteredInstitutions.length) %
              filteredInstitutions.length
            : 0
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredInstitutions[highlightedIndex];
        if (item) {
          handleSelectOption(item);
        }
      }
    }
  };

  const inputId = 'signup-institution-combobox';
  const errorId = 'signup-institution-error';
  const listboxId = 'signup-institution-listbox';

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-[13px] font-bold text-[#172A3A] flex items-center justify-between"
      >
        <span>Trường / đơn vị đào tạo</span>
      </label>

      {/* Selected Institution State OR Search Input Trigger */}
      {selectedInstitution && !isOpen ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-describedby={error ? errorId : undefined}
          onClick={handleOpenDropdown}
          onKeyDown={handleKeyDown}
          className={`w-full min-h-[46px] px-3.5 py-2 rounded-[10px] bg-white border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
            error
              ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
              : 'border-[#DCE7EE] hover:border-[#B8CEDC] focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20'
          } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <Building2
              size={16}
              className="text-[#0D78AE] shrink-0 mt-0.5"
            />
            <span className="text-[13.5px] font-semibold text-[#172A3A] leading-snug line-clamp-2">
              {selectedInstitution.officialName}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleClearSelection}
              aria-label="Đổi trường / đơn vị đào tạo"
              className="p-1 rounded-[6px] text-[#728391] hover:text-[#172A3A] hover:bg-[#F1F6F9] transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
            <ChevronDown size={15} className="text-[#728391]" />
          </div>
        </div>
      ) : (
        <div className="relative flex items-center">
          <Search
            size={15}
            className="absolute left-3.5 text-[#728391] pointer-events-none"
          />
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            disabled={disabled}
            value={searchQuery}
            placeholder="Tìm theo tên trường..."
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className={`w-full h-[46px] pl-9 pr-9 text-[13.5px] text-[#172A3A] placeholder:text-[#728391] bg-white border rounded-[10px] outline-none transition-all ${
              error
                ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
                : isOpen
                ? 'border-[#18A6E0] ring-2 ring-[#18A6E0]/20'
                : 'border-[#DCE7EE] hover:border-[#B8CEDC] focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20'
            }`}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-2.5 p-1 text-[#728391] hover:text-[#172A3A] rounded cursor-pointer"
            >
              <X size={14} />
            </button>
          ) : (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setIsOpen((prev) => !prev)}
              className="absolute right-2.5 p-1 text-[#728391] hover:text-[#172A3A] rounded cursor-pointer"
            >
              <ChevronDown
                size={15}
                className={`transition-transform duration-150 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}
        </div>
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="z-30 w-full mt-0.5 bg-white border border-[#CFE0EC] rounded-[11px] shadow-popover overflow-hidden"
          role="region"
          aria-label="Danh sách trường và đơn vị đào tạo"
        >
          {/* 1. LOADING STATE (Prompt 14 Section 65) */}
          {effectiveLoading ? (
            <div className="px-4 py-5 flex items-center justify-center gap-2.5 text-[13px] text-[#607483]">
              <Loader2 size={16} className="animate-spin text-[#18A6E0]" />
              <span>Đang tải danh sách trường...</span>
            </div>
          ) : effectiveError ? (
            /* 2. INSTITUTION LOAD FAILURE STATE (Prompt 14 Section 66 & 98E) */
            <div className="px-4 py-5 flex flex-col items-center text-center gap-2.5 bg-[#FFFDFB]">
              <div className="w-8 h-8 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
                <AlertCircle size={16} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[13.5px] font-bold text-[#172A3A]">
                  Chưa thể tải danh sách trường.
                </p>
                <p className="text-[12px] text-[#607483]">
                  Vui lòng thử lại để chọn đơn vị đào tạo của bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-0.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#F0F7FC] hover:bg-[#E1F0FA] border border-[#C6E0F2] text-[#0D78AE] text-[12.5px] font-bold transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Thử lại</span>
              </button>
            </div>
          ) : filteredInstitutions.length === 0 ? (
            /* 3. NO INSTITUTION FOUND STATE (Prompt 14 Section 38) */
            <div className="px-4 py-5 text-center space-y-1">
              <p className="text-[13.5px] font-bold text-[#172A3A]">
                Không tìm thấy đơn vị phù hợp.
              </p>
              <p className="text-[12.5px] text-[#607483]">
                Hãy kiểm tra lại tên trường.
              </p>
            </div>
          ) : (
            /* 4. INSTITUTION RESULTS LIST (Prompt 14 Sections 34, 35, 37, 68) */
            <ul
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              aria-label="Đơn vị đào tạo"
              className="max-h-[256px] overflow-y-auto divide-y divide-[#EEF4F8] py-1"
            >
              {filteredInstitutions.map((inst, index) => {
                const isSelected = selectedInstitution?.id === inst.id;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={inst.id}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelectOption(inst)}
                    className={`px-3.5 py-2.5 flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                      isHighlighted
                        ? 'bg-[#EAF6FC]'
                        : isSelected
                        ? 'bg-[#F4FAFE]'
                        : 'hover:bg-[#F8FBFD]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold text-[#172A3A] leading-snug line-clamp-2">
                        {inst.officialName}
                      </div>
                      {inst.organizationContext && (
                        <div className="text-[11.5px] text-[#607483] mt-0.5">
                          {inst.organizationContext}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <Check
                        size={15}
                        className="text-[#0D78AE] shrink-0 mt-0.5"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Field Validation Error directly below field (Prompt 14 Section 61 & 64) */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-[12.5px] font-medium text-[#DC2626] flex items-center gap-1.5 mt-0.5"
        >
          <AlertCircle size={13.5} className="shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
