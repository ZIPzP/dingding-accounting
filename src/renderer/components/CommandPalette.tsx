/**
 * 全局命令面板（Ctrl+K / ⌘K）
 * 顶级应用的标志性交互：搜索并跳转到任意页面或快捷操作
 */
import React, { useEffect, useRef, useState } from 'react';
import { IconSearch, IconRight } from './Icons';

export interface PaletteItem {
  key: string;
  label: string;
  desc?: string;
  icon?: React.ReactNode;
  group?: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: PaletteItem[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose, items }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? items.filter((it) => {
        const q = query.trim().toLowerCase();
        return it.label.toLowerCase().includes(q) || (it.desc ?? '').toLowerCase().includes(q);
      })
    : items;

  /* 打开时重置并聚焦 */
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  /* 键盘导航 */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const target = filtered[activeIndex];
        if (target) {
          target.action();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, activeIndex, onClose]);

  /* 高亮项滚动到可视区 */
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div className="palette-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="palette">
        <div className="palette-input-wrap">
          <IconSearch size={17} />
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="搜索页面或操作…（例如:记一笔、番茄钟、年度报告）"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
          />
          <kbd className="palette-kbd">ESC</kbd>
        </div>
        <div className="palette-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="palette-empty">没有找到「{query}」相关的页面</div>
          )}
          {filtered.map((item, i) => (
            <React.Fragment key={item.key}>
              {item.group && (
                <div className="palette-group">{item.group}</div>
              )}
              <div
                data-index={i}
                className={`palette-item ${i === activeIndex ? 'active' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => {
                  item.action();
                  onClose();
                }}
              >
                <span className="palette-item-icon">{item.icon}</span>
                <span className="palette-item-body">
                  <span className="palette-item-label">{item.label}</span>
                  {item.desc && <span className="palette-item-desc">{item.desc}</span>}
                </span>
                <IconRight size={14} className="palette-item-arrow" />
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="palette-footer">
          <span><kbd>↑↓</kbd> 选择</span>
          <span><kbd>Enter</kbd> 打开</span>
          <span><kbd>ESC</kbd> 关闭</span>
          <span className="palette-footer-brand">青孤项目 · 命令面板</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
