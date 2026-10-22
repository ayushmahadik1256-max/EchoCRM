import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface EditableChipListProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  helperText?: string;
}

export const EditableChipList: React.FC<EditableChipListProps> = ({
  label,
  items,
  onChange,
  placeholder = 'Add new item…',
  helperText,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (!items.includes(trimmed)) {
      onChange([...items, trimmed]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
          {label}
        </label>
        {items.length > 0 && (
          <span className="text-[11px] text-[#5B6B7F] font-mono tabular-nums">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {/* Chip display */}
      <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-[#F3F9FF]/60 border border-[#CFE6FF] rounded-xl">
        {items.length === 0 ? (
          <span className="text-xs text-[#5B6B7F] italic py-1 px-1">
            None recorded or needs confirmation.
          </span>
        ) : (
          items.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#0F172A] bg-white border border-[#CFE6FF] rounded-lg shadow-2xs group transition-all hover:border-[#1A73D9]/40 hover:shadow-xs animate-fadeIn"
            >
              <span className="max-w-[280px] break-words">{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-[#5B6B7F] hover:text-rose-600 transition-colors p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                aria-label={`Remove ${item}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Add item input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9] focus:ring-2 focus:ring-[#1A73D9]/20"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#1A73D9] bg-[#F3F9FF] border border-[#CFE6FF] rounded-xl hover:bg-[#E4F1FF] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {helperText && <p className="text-[11px] text-[#5B6B7F]">{helperText}</p>}
    </div>
  );
};
