/**
 * 成就殿堂 — 全站成就徽章展示
 * 分组展示 记账 / 工具 / 游戏 三类成就，未解锁为灰色剪影
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Empty, Spin } from 'antd';
import { IconTower, IconReport } from '../components/Icons';
import { ACHIEVEMENTS, achGetState, achSetMax } from '../services/achievements';
import { api } from '../services/api';

const GROUPS: { key: '记账' | '工具' | '游戏'; emoji: string; desc: string }[] = [
  { key: '记账', emoji: '📒', desc: '每一笔账,都是生活的印记' },
  { key: '工具', emoji: '🧰', desc: '坚持与自律,值得被奖励' },
  { key: '游戏', emoji: '🎮', desc: '快乐至上,分数说话' },
];

const AchievementsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState<Record<string, string>>({});

  useEffect(() => {
    /* 从已有数据初始化成就计数（老用户的历史成就也能点亮） */
    (async () => {
      try {
        const [all, exp, inc] = await Promise.all([
          api.getRecords({ pageSize: 1 }),
          api.getRecords({ pageSize: 1, type: 'expense' }),
          api.getRecords({ pageSize: 1, type: 'income' }),
        ]);
        achSetMax('record_total', all.total);
        achSetMax('record_expense', exp.total);
        achSetMax('record_income', inc.total);
      } catch { /* noop */ }
      /* 游戏成就:读取游戏本地最高分 */
      try {
        const stackBest = parseFloat(localStorage.getItem('qg_best_stack') || '0') || 0;
        if (stackBest >= 10) achSetMax('game_stack10', 1);
        const f2048 = parseFloat(localStorage.getItem('f2048_best') || '0') || 0;
        if (f2048 >= 512) achSetMax('game_2048_512', 1);
        const snake = JSON.parse(localStorage.getItem('snake_hs') || '[]');
        if (Array.isArray(snake) && snake.length > 0) {
          const maxScore = Math.max(...snake.map((s: { score?: number }) => s.score || 0));
          if (maxScore >= 100) achSetMax('game_snake_100', 1);
        }
      } catch { /* noop */ }
      setUnlocked(achGetState().unlocked);
      setLoading(false);
    })();
  }, []);

  const totalUnlocked = useMemo(() => Object.keys(unlocked).length, [unlocked]);

  return (
    <div className="page-card">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconTower size={22} /> 成就殿堂
      </div>
      <p className="page-sub">
        已点亮 {totalUnlocked} / {ACHIEVEMENTS.length} 枚徽章,继续加油!
      </p>

      <Spin spinning={loading}>
        {ACHIEVEMENTS.length === 0 ? (
          <Empty description="暂无成就" />
        ) : (
          <div className="ach-groups">
            {GROUPS.map((group) => {
              const items = ACHIEVEMENTS.filter((a) => a.group === group.key);
              const unlockedCount = items.filter((a) => unlocked[a.id]).length;
              return (
                <div className="ach-group" key={group.key}>
                  <div className="ach-group-head">
                    <span className="ach-group-title">
                      {group.emoji} {group.key}成就
                      <i className="ach-group-count">{unlockedCount}/{items.length}</i>
                    </span>
                    <span className="ach-group-desc">{group.desc}</span>
                  </div>
                  <div className="ach-grid">
                    {items.map((a) => {
                      const date = unlocked[a.id];
                      return (
                        <div key={a.id} className={`ach-card ${date ? 'unlocked' : 'locked'}`}>
                          <div className="ach-icon">{a.icon}</div>
                          <div className="ach-name">{a.name}</div>
                          <div className="ach-desc">{a.desc}</div>
                          <div className="ach-date">{date ? date : '未解锁'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Spin>
    </div>
  );
};

export default AchievementsPage;
