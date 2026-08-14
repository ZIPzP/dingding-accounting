/**
 * 工具中心 — 生活工具总览
 * 记账 / 倒数日 / 番茄钟 / 备忘录
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconBook, IconPlusCircle, IconHourglass, IconTimer, IconNote, IconRight, IconTools,
} from '../components/Icons';

interface ToolItem {
  key: string;
  name: string;
  icon: React.FC<{ size?: number }>;
  desc: string;
  route: string;
  color: string;
  tag: string;
}

const tools: ToolItem[] = [
  { key: 'bookkeeping', name: '收支记账', icon: IconBook, desc: '九大分类 + 收入记账 + 月度预算，账目一目了然', route: '/bills', color: '#06b6d4', tag: '核心工具' },
  { key: 'quickadd', name: '记一笔', icon: IconPlusCircle, desc: '随手记录一笔支出或收入，快如闪电', route: '/add', color: '#4f6df5', tag: '快捷入口' },
  { key: 'countdown', name: '倒数日', icon: IconHourglass, desc: '纪念日、考试、发薪日……重要日子不再错过', route: '/tools/countdown', color: '#ec4899', tag: '生活助手' },
  { key: 'pomodoro', name: '番茄钟', icon: IconTimer, desc: '25 分钟专注 + 5 分钟休息，效率翻倍', route: '/tools/pomodoro', color: '#f59e0b', tag: '专注效率' },
  { key: 'notes', name: '备忘录', icon: IconNote, desc: '随手记下灵感与待办，彩色便签随心贴', route: '/tools/notes', color: '#10b981', tag: '生活助手' },
];

const ToolsHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-card">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconTools size={22} /> 生活工具
      </div>
      <p className="page-sub">日常小工具集合，全部离线可用，数据保存在本地</p>

      <div className="tool-hub-grid">
        {tools.map((tool) => {
          const ToolIcon = tool.icon;
          return (
            <div
              key={tool.key}
              className="tool-hub-card"
              style={{ '--tc': tool.color } as React.CSSProperties}
              onClick={() => navigate(tool.route)}
            >
              <div className="tool-hub-icon">
                <ToolIcon size={28} />
              </div>
              <div className="tool-hub-body">
                <div className="tool-hub-top">
                  <span className="tool-hub-name">{tool.name}</span>
                  <span className="tool-hub-tag">{tool.tag}</span>
                </div>
                <div className="tool-hub-desc">{tool.desc}</div>
              </div>
              <IconRight size={16} className="tool-hub-arrow" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ToolsHub;
