/**
 * 线性 SVG 图标组件库
 * 零外部依赖，统一 24x24 viewBox，颜色继承父级 currentColor
 */
import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const mk = (d: string, size = 24) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

/* ==================== 导航图标 ==================== */

export const IconHome: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10", size)}</span>
);

export const IconBook: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z M12 6v7 M16 6v7", size)}</span>
);

export const IconPlusCircle: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 8v8 M8 12h8", size)}</span>
);

export const IconChart: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M18 20V10 M12 20V4 M6 20v-6", size)}</span>
);

export const IconSettings: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", size)}</span>
);

export const IconGamepad: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M6 12h4m-2-2v4 M15 10l.01.01M18 12l.01.01 M17.32 5H6.68a4 4 0 0 0-3.978 3.59C2.01 13.28 2 13.76 2 14a6 6 0 0 0 6 6c1.54 0 2.94-.72 4-1.73a5 5 0 0 0 4 1.73 6 6 0 0 0 6-6c0-.24-.01-.72-.702-5.41A4 4 0 0 0 17.32 5z", size)}</span>
);

/* ==================== 游戏专属图标 ==================== */

export const IconSnake: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M2 12h4l2 3h4l2-3h2l2 3h4 M20 9h-2l-2 3h-4l-2-3H8l-2 3H4", size)}</span>
);

export const IconTetris: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M4 8h4v4H4z M12 8h4v4h-4z M8 12h4v4H8z M12 16h4v4h-4z M8 4h4v4H8z", size)}</span>
);

export const Icon2048: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z", size)}</span>
);

export const IconMine: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 8v4 M12 16h.01 M4.93 4.93l2.12 2.12 M14.83 14.83l2.12 2.12 M2 12h2 M20 12h2 M4.93 19.07l2.12-2.12 M14.83 9.17l2.12-2.12", size)}</span>
);

export const IconBreakout: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z M15 5l3 3", size)}</span>
);

export const IconWhackAMole: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z", size)}</span>
);

export const IconTicTacToe: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M18 6 6 18 M6 6l12 12 M12 2v20 M2 12h20", size)}</span>
);

/* ==================== 通用操作图标 ==================== */

export const IconRight: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M9 18l6-6-6-6", size)}</span>
);

export const IconLeft: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M15 18l-6-6 6-6", size)}</span>
);

export const IconDownload: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3", size)}</span>
);

export const IconUpload: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12", size)}</span>
);

export const IconInfo: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 16v-4 M12 8h.01", size)}</span>
);

export const IconEdit: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z", size)}</span>
);

export const IconDelete: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6", size)}</span>
);

export const IconSearch: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35", size)}</span>
);

export const IconSave: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8", size)}</span>
);

export const IconTool: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z", size)}</span>
);

export const IconSparkle: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M12 3l1.88 5.26a3 3 0 0 0 1.86 1.86L21 12l-5.26 1.88a3 3 0 0 0-1.86 1.86L12 21l-1.88-5.26a3 3 0 0 0-1.86-1.86L3 12l5.26-1.88a3 3 0 0 0 1.86-1.86L12 3z", size)}</span>
);

export const IconWallet: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M21 12V7H5a2 2 0 0 1 0-4h14v4 M3 5v14a2 2 0 0 0 2 2h16v-5 M18 12a1 1 0 1 0 0-2", size)}</span>
);

export const IconCalendar: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M8 3v3M16 3v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", size)}</span>
);

export const IconZap: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M13 2 3 14h9l-1 8 10-12h-9l1-8z", size)}</span>
);

export const IconShopping: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0", size)}</span>
);

/* Logo 图标 */
export const IconLogo: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="2" y="2" width="28" height="28" rx="8" stroke="currentColor" strokeWidth="2"/>
      <circle cx="11" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="21" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M7 22c2.5-3 6-5 9-5s6.5 2 9 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M16 2v3 M16 27v3 M2 16h3 M27 16h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  </span>
);

/* ==================== 生活工具图标 ==================== */

export const IconTools: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M3 21h4l13-13a2.828 2.828 0 1 0-4-4L3 17v4z M14.5 5.5l4 4", size)}</span>
);

export const IconHourglass: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M6 2h12 M6 22h12 M7 2v3l5 7-5 7v3 M17 2v3l-5 7 5 7v3", size)}</span>
);

export const IconTimer: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M12 10v6 M9 2h6", size)}</span>
);

export const IconNote: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z", size)}</span>
);

export const IconPlay: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M8 5v14l11-7L8 5z", size)}</span>
);

export const IconPause: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M8 5v14 M16 5v14", size)}</span>
);

export const IconReset: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M3 12a9 9 0 1 0 3-6.7 M3 4v5h5", size)}</span>
);

export const IconTrash: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6", size)}</span>
);

export const IconWave: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M2 12h2a2 2 0 0 0 4 0 2 2 0 0 1 4 0 2 2 0 0 0 4 0 2 2 0 0 1 4 0h2 M2 16h2a2 2 0 0 0 4 0 2 2 0 0 1 4 0 2 2 0 0 0 4 0 2 2 0 0 1 4 0h2 M2 8h2a2 2 0 0 0 4 0 2 2 0 0 1 4 0 2 2 0 0 0 4 0 2 2 0 0 1 4 0h2", size)}</span>
);

export const IconTarget: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", size)}</span>
);

export const IconCheckCircle: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M9 12l2 2 4-4", size)}</span>
);

export const IconReport: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M3 3v18h18 M8 17v-5 M13 17V7 M18 17v-9", size)}</span>
);

export const IconFire: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M12 2s4 4.5 4 8.5A4 4 0 0 1 8 10.5c0-1 .5-2 1-2.5 0 1.5 1 3 3 4-1-2-1-5 0-10z M8 15a4 4 0 0 0 8 0c0-1-.5-1.5-1-2 .5 1 1 2 1 3", size)}</span>
);

export const IconPalette: React.FC<IconProps> = ({ size = 24, className }) => (
  <span className={className}>{mk("M12 2a10 10 0 1 0 0 20 2 2 0 0 0 2-2c0-.6-.3-1-.7-1.4-.4-.5-.6-1-.6-1.6a2 2 0 0 1 2-2h2.8A4.5 4.5 0 0 0 22 10.5C22 5.8 17.5 2 12 2z M7.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M12 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M16.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", size)}</span>
);
