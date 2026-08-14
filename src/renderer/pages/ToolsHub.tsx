/**
 * 工具中心 — 生活工具总览
 * 记账 / 倒数日 / 番茄钟 / 白噪音 / 备忘录 / 心愿单 / 习惯打卡 / 年度报告
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconBook, IconPlusCircle, IconHourglass, IconTimer, IconNote, IconRight, IconTools,
  IconWave, IconTarget, IconCheckCircle, IconReport,
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

/** Emoji 图标适配器 */
const EmojiIcon = (emoji: string): React.FC<{ size?: number }> =>
  ({ size = 28 }) => <span style={{ fontSize: size * 0.95, lineHeight: 1 }}>{emoji}</span>;

const tools: ToolItem[] = [
  { key: 'fox', name: '青狐伙伴', icon: EmojiIcon('🦊'), desc: '虚拟宠物小狐狸:赚狐粮、喂食、进化', route: '/fox', color: '#fb923c', tag: '招牌伙伴' },
  { key: 'bookkeeping', name: '收支记账', icon: IconBook, desc: '九大分类 + 收入记账 + 月度预算，账目一目了然', route: '/bills', color: '#06b6d4', tag: '核心工具' },
  { key: 'quickadd', name: '智能记账', icon: IconPlusCircle, desc: '像聊天一样记账:「中午吃面15」自动识别填入', route: '/add', color: '#4f6df5', tag: '招牌功能' },
  { key: 'countdown', name: '倒数日', icon: IconHourglass, desc: '纪念日、考试、发薪日……重要日子不再错过', route: '/tools/countdown', color: '#ec4899', tag: '生活助手' },
  { key: 'pomodoro', name: '番茄钟', icon: IconTimer, desc: '25 分钟专注 + 5 分钟休息，效率翻倍', route: '/tools/pomodoro', color: '#f59e0b', tag: '专注效率' },
  { key: 'whitenoise', name: '白噪音', icon: IconWave, desc: '雨声 / 海浪 / 篝火实时合成，助你专注入眠', route: '/tools/whitenoise', color: '#0ea5e9', tag: '助眠专注' },
  { key: 'notes', name: '备忘录', icon: IconNote, desc: '随手记下灵感与待办，彩色便签随心贴', route: '/tools/notes', color: '#10b981', tag: '生活助手' },
  { key: 'wishlist', name: '心愿单', icon: IconTarget, desc: '想要的东西一点点攒，攒钱进度看得见', route: '/tools/wishlist', color: '#8b5cf6', tag: '攒钱计划' },
  { key: 'habits', name: '习惯打卡', icon: IconCheckCircle, desc: '每天一点点，连续天数火焰见证坚持', route: '/tools/habits', color: '#f43f5e', tag: '自我成长' },
  { key: 'capsule', name: '时间胶囊', icon: EmojiIcon('💌'), desc: '写信给未来的自己，到点才能开启', route: '/tools/capsule', color: '#d946ef', tag: '仪式感' },
  { key: 'music', name: '音乐工坊', icon: IconNote, desc: '8-bit 编曲器，点格子谱出你的旋律', route: '/tools/music', color: '#f472b6', tag: '创作' },
  { key: 'report', name: '年度报告', icon: IconReport, desc: '把这一年的每一笔，变成有仪式感的总结', route: '/report', color: '#14b8a6', tag: '年度特辑' },
];

const ToolsHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-card">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconTools size={22} /> 生活工具
      </div>
      <p className="page-sub">9 款日常小工具,全部离线可用,数据保存在本地</p>

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
