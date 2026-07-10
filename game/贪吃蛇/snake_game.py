#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
贪吃蛇游戏 —— 经典的贪吃蛇游戏，使用 Python + Pygame 实现。

操作说明：
  方向键 / WASD  — 控制蛇的移动
  P               — 暂停 / 继续
  R               — 重新开始
  L               — 查看排行榜
  ESC / Q         — 退出游戏

规则：
  - 吃到红色食物得 10 分，蛇变长一格
  - 撞到墙壁或自己的身体则游戏结束
  - 随着得分提高，蛇的移动速度会逐渐加快
  - 游戏结束时会自动检测是否进入排行榜前 10 名
"""

import pygame
import random
import sys
import json
import os
import colorsys
from collections import deque
from enum import Enum


# ── 常量配置 ──────────────────────────────────────────────
class Config:
    CELL_SIZE = 20              # 每格像素大小
    GRID_WIDTH = 40             # 网格宽度（格数）
    GRID_HEIGHT = 30            # 网格高度（格数）
    WINDOW_WIDTH = CELL_SIZE * GRID_WIDTH     # 800
    WINDOW_HEIGHT = CELL_SIZE * GRID_HEIGHT   # 600
    MAX_FPS = 18                # 最高速度（含得分加成）

    # 颜色
    COLOR_BG = (15, 15, 25)
    COLOR_GRID = (30, 30, 45)
    COLOR_SNAKE_HEAD = (100, 220, 100)    # 默认蛇头（绿色），会被动态颜色覆盖
    COLOR_SNAKE_BODY = (60, 180, 60)      # 默认蛇身（绿色），会被动态颜色覆盖
    COLOR_SNAKE_BODY_DARK = (35, 120, 35) # 保留兼容
    COLOR_FOOD = (240, 60, 60)
    COLOR_FOOD_GLOW = (255, 140, 140)
    COLOR_TEXT = (220, 220, 220)
    COLOR_TEXT_DIM = (140, 140, 140)
    COLOR_ACCENT = (255, 200, 50)
    COLOR_GAME_OVER = (240, 80, 80)
    COLOR_PAUSE = (200, 200, 100)
    COLOR_OVERLAY_BG = (0, 0, 0, 170)
    COLOR_INPUT_BG = (40, 40, 60)
    COLOR_INPUT_BORDER = (100, 100, 160)
    COLOR_INPUT_ACTIVE = (140, 180, 255)
    COLOR_CROWN = (255, 215, 0)
    COLOR_SILVER = (192, 192, 192)
    COLOR_BRONZE = (205, 150, 80)

    SCORE_PER_FOOD = 10
    LEADERBOARD_FILE = "highscores.json"
    MAX_LEADERBOARD = 10
    MAX_NAME_LENGTH = 10

    # 蛇颜色预设 (RGB)
    SNAKE_COLORS = [
        ("🟢 绿色", (60, 180, 60), (100, 220, 100)),     # body, head
        ("🔵 蓝色", (60, 120, 200), (100, 170, 240)),
        ("🔴 红色", (200, 60, 60), (240, 100, 100)),
        ("🟡 黄色", (200, 180, 40), (240, 220, 80)),
        ("🟣 紫色", (140, 60, 200), (180, 100, 240)),
        ("🩵 青色", (60, 190, 190), (100, 230, 230)),
        ("⚪ 白色", (180, 180, 180), (220, 220, 220)),
        ("🟠 橙色", (220, 130, 40), (255, 170, 80)),
        ("🌈 彩虹", None, None),   # 特殊标志
    ]
    BASE_FPS = 6
    MIN_BASE_FPS = 1
    MAX_BASE_FPS = 20


# ── 方向枚举 ──────────────────────────────────────────────
class Direction(Enum):
    UP = (0, -1)
    DOWN = (0, 1)
    LEFT = (-1, 0)
    RIGHT = (1, 0)


# ── 排行榜管理器 ──────────────────────────────────────────
class Leaderboard:
    """持久化排行榜，按分数降序排列"""

    def __init__(self, filepath: str, max_entries: int = 10):
        self.filepath = filepath
        self.max_entries = max_entries
        self.entries: list[dict] = self._load()

    def _load(self) -> list[dict]:
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        return data[:self.max_entries]
            except (json.JSONDecodeError, IOError):
                pass
        return []

    def _save(self):
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self.entries, f, ensure_ascii=False, indent=2)
        except IOError:
            pass

    def is_qualifying(self, score: int) -> bool:
        """判断该分数是否能进入排行榜"""
        if score <= 0:
            return False
        if len(self.entries) < self.max_entries:
            return True
        return score > self.entries[-1]["score"]

    def add(self, name: str, score: int):
        """添加一条记录并保存"""
        self.entries.append({"name": name, "score": score})
        self.entries.sort(key=lambda e: e["score"], reverse=True)
        self.entries = self.entries[:self.max_entries]
        self._save()

    def clear(self):
        """清空排行榜"""
        self.entries = []
        self._save()


# ── 游戏状态枚举 ──────────────────────────────────────────
class GameState(Enum):
    PLAYING = "playing"
    PAUSED = "paused"
    GAME_OVER = "game_over"
    NAME_ENTRY = "name_entry"
    LEADERBOARD = "leaderboard"


# ── 主游戏类 ──────────────────────────────────────────────
class SnakeGame:
    def __init__(self):
        pygame.init()
        pygame.display.set_caption("🐍 贪吃蛇")
        self.screen = pygame.display.set_mode(
            (Config.WINDOW_WIDTH, Config.WINDOW_HEIGHT)
        )
        self.clock = pygame.time.Clock()

        # 字体
        self.font_title = self._load_font(52, bold=True)
        self.font_large = self._load_font(36, bold=True)
        self.font_medium = self._load_font(24)
        self.font_small = self._load_font(18)
        self.font_leaderboard = self._load_font(22)

        # 排行榜
        self.leaderboard = Leaderboard(
            os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         Config.LEADERBOARD_FILE),
            Config.MAX_LEADERBOARD,
        )

        # 速度与颜色偏好
        self.base_fps = Config.BASE_FPS
        self.color_index = 0       # 0 = green (default)
        self.is_rainbow = False

        self.reset_game()

    def _load_font(self, size: int, bold: bool = False) -> pygame.font.Font:
        """安全加载字体"""
        candidates = ["microsoftyahei", "simhei", "simsun", "arial", "consolas"]
        for name in candidates:
            try:
                return pygame.font.SysFont(name, size, bold=bold)
            except Exception:
                continue
        return pygame.font.Font(None, size)

    # ── 重置游戏状态 ────────────────────────────────────
    def reset_game(self):
        start_x = Config.GRID_WIDTH // 2
        start_y = Config.GRID_HEIGHT // 2
        self.snake = deque([
            (start_x, start_y),
            (start_x - 1, start_y),
            (start_x - 2, start_y),
        ])
        self.direction = Direction.RIGHT
        self.next_direction = Direction.RIGHT
        self.score = 0
        self.food = self._spawn_food()
        self.state = GameState.PLAYING
        self.input_name = ""          # 名字输入缓冲区
        self.cursor_blink = 0         # 光标闪烁计数器
        self.show_leaderboard_overlay = False

    # ── 生成食物 ────────────────────────────────────────
    def _spawn_food(self) -> tuple[int, int]:
        snake_set = set(self.snake)
        empty = [
            (x, y)
            for x in range(Config.GRID_WIDTH)
            for y in range(Config.GRID_HEIGHT)
            if (x, y) not in snake_set
        ]
        if not empty:
            return (-1, -1)
        return random.choice(empty)

    # ── 处理事件 ────────────────────────────────────────
    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False

            if event.type == pygame.KEYDOWN:
                # 全局快捷键
                if event.key in (pygame.K_ESCAPE, pygame.K_q):
                    if self.state == GameState.NAME_ENTRY:
                        # 名字输入中按 ESC：放弃输入，直接看排行榜
                        self._check_and_enter_leaderboard()
                    else:
                        return False

                if event.key == pygame.K_l:
                    # L 键切换排行榜显示
                    if self.state == GameState.PLAYING:
                        self.state = GameState.LEADERBOARD
                    elif self.state == GameState.LEADERBOARD:
                        self.state = GameState.PLAYING
                    elif self.state == GameState.PAUSED:
                        self.show_leaderboard_overlay = not self.show_leaderboard_overlay
                    continue

                # 速度调节（非名字输入时生效）
                if event.key in (pygame.K_EQUALS, pygame.K_PLUS, pygame.K_KP_PLUS):
                    if self.state != GameState.NAME_ENTRY and self.base_fps < Config.MAX_BASE_FPS:
                        self.base_fps += 1
                    continue
                if event.key in (pygame.K_MINUS, pygame.K_KP_MINUS):
                    if self.state != GameState.NAME_ENTRY and self.base_fps > Config.MIN_BASE_FPS:
                        self.base_fps -= 1
                    continue

                # 颜色切换（全局生效）
                if event.key == pygame.K_c and self.state != GameState.NAME_ENTRY:
                    self.color_index = (self.color_index + 1) % len(Config.SNAKE_COLORS)
                    self.is_rainbow = (self.color_index == len(Config.SNAKE_COLORS) - 1)
                    continue

                # 名字输入模式
                if self.state == GameState.NAME_ENTRY:
                    if event.key == pygame.K_RETURN:
                        self._check_and_enter_leaderboard()
                    elif event.key == pygame.K_BACKSPACE:
                        self.input_name = self.input_name[:-1]
                    elif len(self.input_name) < Config.MAX_NAME_LENGTH:
                        if self._is_printable_char(event):
                            self.input_name += event.unicode
                    continue

                # 游戏结束或排行榜查看
                if self.state == GameState.GAME_OVER:
                    if event.key == pygame.K_r:
                        self.reset_game()
                    continue

                if self.state == GameState.LEADERBOARD:
                    if event.key == pygame.K_r:
                        self.reset_game()
                    elif event.key in (pygame.K_ESCAPE, pygame.K_l):
                        self.state = GameState.PLAYING
                    continue

                # 暂停
                if event.key == pygame.K_p:
                    if self.state == GameState.PLAYING:
                        self.state = GameState.PAUSED
                    elif self.state == GameState.PAUSED:
                        self.state = GameState.PLAYING

                # 重新开始
                if event.key == pygame.K_r:
                    self.reset_game()

                # 运动方向
                if self.state == GameState.PLAYING:
                    self._handle_direction(event.key)

        return True

    def _handle_direction(self, key):
        if key in (pygame.K_UP, pygame.K_w):
            if self.direction != Direction.DOWN:
                self.next_direction = Direction.UP
        elif key in (pygame.K_DOWN, pygame.K_s):
            if self.direction != Direction.UP:
                self.next_direction = Direction.DOWN
        elif key in (pygame.K_LEFT, pygame.K_a):
            if self.direction != Direction.RIGHT:
                self.next_direction = Direction.LEFT
        elif key in (pygame.K_RIGHT, pygame.K_d):
            if self.direction != Direction.LEFT:
                self.next_direction = Direction.RIGHT

    def _is_printable_char(self, event) -> bool:
        """判断按键是否是可输入的字符"""
        return event.unicode and event.unicode.isprintable() and len(event.unicode) == 1

    def _check_and_enter_leaderboard(self):
        """保存分数到排行榜（如果合格）并切换到结算界面"""
        name = self.input_name.strip() or "无名"
        self.leaderboard.add(name, self.score)
        self.input_name = ""
        self.state = GameState.GAME_OVER
        # 获取得分在排行榜中的位置以高亮显示
        self._highlight_rank = None
        for i, entry in enumerate(self.leaderboard.entries):
            if entry["name"] == name and entry["score"] == self.score:
                self._highlight_rank = i
                break

    # ── 更新逻辑 ────────────────────────────────────────
    def update(self):
        if self.state != GameState.PLAYING:
            # 更新光标闪烁
            self.cursor_blink = (self.cursor_blink + 1) % 40
            return

        # 应用缓冲方向
        self.direction = self.next_direction

        # 新头部坐标
        head_x, head_y = self.snake[0]
        dx, dy = self.direction.value
        new_head = (head_x + dx, head_y + dy)

        # 墙壁碰撞
        nx, ny = new_head
        if nx < 0 or nx >= Config.GRID_WIDTH or ny < 0 or ny >= Config.GRID_HEIGHT:
            self._on_game_over()
            return

        # 食物检测
        will_eat = new_head == self.food

        if not will_eat:
            self.snake.pop()

        if new_head in self.snake:
            self._on_game_over()
            return

        self.snake.appendleft(new_head)

        if will_eat:
            self.score += Config.SCORE_PER_FOOD
            self.food = self._spawn_food()
            if self.food == (-1, -1):
                self.state = GameState.GAME_OVER

    def _on_game_over(self):
        """游戏结束：检测是否需要输入名字"""
        self.state = GameState.GAME_OVER
        if self.leaderboard.is_qualifying(self.score):
            self.state = GameState.NAME_ENTRY
            self.input_name = ""

    # ════════════════════════════════════════════════════════
    #  渲染
    # ════════════════════════════════════════════════════════

    def draw(self):
        if self.state == GameState.LEADERBOARD:
            self._draw_leaderboard_page()
        else:
            self._draw_background()
            self._draw_food()
            self._draw_snake()
            self._draw_hud()

            if self.state == GameState.PAUSED:
                self._draw_overlay("暂停中", Config.COLOR_PAUSE, "按 P 继续")
                if self.show_leaderboard_overlay:
                    self._draw_leaderboard_panel()
            elif self.state == GameState.GAME_OVER:
                self._draw_game_over_screen()
            elif self.state == GameState.NAME_ENTRY:
                self._draw_game_over_screen()
                self._draw_name_entry()

        pygame.display.flip()

    # ── 背景 ──────────────────────────────────────────
    def _draw_background(self):
        self.screen.fill(Config.COLOR_BG)
        for x in range(0, Config.WINDOW_WIDTH, Config.CELL_SIZE):
            pygame.draw.line(
                self.screen, Config.COLOR_GRID,
                (x, 0), (x, Config.WINDOW_HEIGHT)
            )
        for y in range(0, Config.WINDOW_HEIGHT, Config.CELL_SIZE):
            pygame.draw.line(
                self.screen, Config.COLOR_GRID,
                (0, y), (Config.WINDOW_WIDTH, y)
            )

    # ── 蛇 ────────────────────────────────────────────
    def _draw_snake(self):
        now = pygame.time.get_ticks()

        for i, (sx, sy) in enumerate(self.snake):
            rect = pygame.Rect(
                sx * Config.CELL_SIZE + 1,
                sy * Config.CELL_SIZE + 1,
                Config.CELL_SIZE - 2,
                Config.CELL_SIZE - 2,
            )

            if self.is_rainbow:
                # 彩虹模式：基于段索引 + 时间偏移
                hue = (i * 12 + now // 60) % 360
                # 将 HSV(hue, 0.8, 0.9) 转为 RGB
                r, g, b = colorsys.hsv_to_rgb(hue / 360, 0.8, 0.9)
                body_color = (int(r * 255), int(g * 255), int(b * 255))
                # 蛇头稍亮（降低饱和度，提高亮度）
                head_r, head_g, head_b = colorsys.hsv_to_rgb(hue / 360, 0.4, 1.0)
                head_color = (int(head_r * 255), int(head_g * 255), int(head_b * 255))
            else:
                # 预设颜色模式
                _, base_body, base_head = Config.SNAKE_COLORS[self.color_index]
                body_color = base_body
                head_color = base_head

            if i == 0:
                # 蛇头
                pygame.draw.rect(self.screen, head_color, rect, border_radius=5)
                # 眼睛（始终白色+黑色瞳孔）
                eye_r = 3
                cx, cy = rect.centerx, rect.centery
                offsets = {
                    Direction.RIGHT: ((3, -4), (3, 4)),
                    Direction.LEFT: ((-3, -4), (-3, 4)),
                    Direction.UP: ((-4, -3), (4, -3)),
                    Direction.DOWN: ((-4, 3), (4, 3)),
                }
                for dx, dy in offsets.get(self.direction, ((0, 0), (0, 0))):
                    ex, ey = cx + dx, cy + dy
                    pygame.draw.circle(self.screen, (255, 255, 255), (ex, ey), eye_r)
                    pygame.draw.circle(self.screen, (0, 0, 0), (ex, ey), eye_r // 2)
            else:
                # 蛇身：越靠尾部越暗
                ratio = max(0.35, 1.0 - i / max(len(self.snake) * 1.3, 1))
                r = int(body_color[0] * ratio)
                g = int(body_color[1] * ratio)
                b = int(body_color[2] * ratio)
                pygame.draw.rect(self.screen, (r, g, b), rect, border_radius=4)

    # ── 食物 ──────────────────────────────────────────
    def _draw_food(self):
        fx, fy = self.food
        pulse = abs(pygame.time.get_ticks() % 800 - 400) / 400.0
        size_offset = int(pulse * 3)

        cx = fx * Config.CELL_SIZE + Config.CELL_SIZE // 2
        cy = fy * Config.CELL_SIZE + Config.CELL_SIZE // 2
        radius = Config.CELL_SIZE // 2 - 2 + size_offset

        # 光晕
        glow_r = radius + 5
        glow = pygame.Surface((glow_r * 2, glow_r * 2), pygame.SRCALPHA)
        pygame.draw.circle(glow, (*Config.COLOR_FOOD_GLOW, 50), (glow_r, glow_r), glow_r)
        self.screen.blit(glow, (cx - glow_r, cy - glow_r))

        # 主体
        pygame.draw.circle(self.screen, Config.COLOR_FOOD, (cx, cy), radius)
        # 高光
        hl = (min(255, Config.COLOR_FOOD[0] + 80),
              min(255, Config.COLOR_FOOD[1] + 60),
              min(255, Config.COLOR_FOOD[2] + 60))
        pygame.draw.circle(self.screen, hl,
                           (cx - radius // 3, cy - radius // 3),
                           max(1, radius // 3))

    # ── HUD ───────────────────────────────────────────
    def _draw_hud(self):
        score_text = self.font_small.render(
            f"得分: {self.score}", True, Config.COLOR_TEXT)
        speed_text = self.font_small.render(
            f"速度: {self._current_fps()} [=/-]", True, Config.COLOR_TEXT)
        color_name, _, _ = Config.SNAKE_COLORS[self.color_index]
        color_text = self.font_small.render(
            f"{color_name} [C]", True, Config.COLOR_TEXT)
        hint_text = self.font_small.render(
            "L-排行榜", True, Config.COLOR_TEXT_DIM)

        self.screen.blit(score_text, (12, 10))
        self.screen.blit(color_text, (Config.WINDOW_WIDTH // 2 - 60, 10))
        self.screen.blit(speed_text, (Config.WINDOW_WIDTH - 160, 10))
        self.screen.blit(hint_text, (Config.WINDOW_WIDTH - 90, Config.WINDOW_HEIGHT - 26))

    # ── 通用遮罩文字 ─────────────────────────────────
    def _draw_overlay(self, title: str, color: tuple, subtitle: str = ""):
        overlay = pygame.Surface(
            (Config.WINDOW_WIDTH, Config.WINDOW_HEIGHT), pygame.SRCALPHA)
        overlay.fill(Config.COLOR_OVERLAY_BG)
        self.screen.blit(overlay, (0, 0))

        title_surf = self.font_large.render(title, True, color)
        tr = title_surf.get_rect(
            center=(Config.WINDOW_WIDTH // 2, Config.WINDOW_HEIGHT // 2 - 30))
        self.screen.blit(title_surf, tr)

        if subtitle:
            sub = self.font_medium.render(subtitle, True, Config.COLOR_TEXT)
            sr = sub.get_rect(
                center=(Config.WINDOW_WIDTH // 2, Config.WINDOW_HEIGHT // 2 + 20))
            self.screen.blit(sub, sr)

    # ── 游戏结束画面 ─────────────────────────────────
    def _draw_game_over_screen(self):
        overlay = pygame.Surface(
            (Config.WINDOW_WIDTH, Config.WINDOW_HEIGHT), pygame.SRCALPHA)
        overlay.fill(Config.COLOR_OVERLAY_BG)
        self.screen.blit(overlay, (0, 0))

        # 标题
        title = self.font_large.render("游戏结束", True, Config.COLOR_GAME_OVER)
        tr = title.get_rect(center=(Config.WINDOW_WIDTH // 2, 60))
        self.screen.blit(title, tr)

        # 分数
        score_text = self.font_large.render(
            f"得分: {self.score}", True, Config.COLOR_ACCENT)
        sr = score_text.get_rect(center=(Config.WINDOW_WIDTH // 2, 120))
        self.screen.blit(score_text, sr)

        # 排行榜
        self._draw_leaderboard_panel(top_y=170)

        # 底部提示
        hint = self.font_small.render(
            "按 R 重新开始  |  按 ESC 退出", True, Config.COLOR_TEXT_DIM)
        hr = hint.get_rect(
            center=(Config.WINDOW_WIDTH // 2, Config.WINDOW_HEIGHT - 30))
        self.screen.blit(hint, hr)

    # ── 名字输入 ─────────────────────────────────────
    def _draw_name_entry(self):
        box_w, box_h = 300, 50
        box_x = Config.WINDOW_WIDTH // 2 - box_w // 2
        box_y = Config.WINDOW_HEIGHT // 2 + 60

        # 提示文字
        prompt = self.font_medium.render(
            "🏆 新纪录！请输入你的名字：", True, Config.COLOR_ACCENT)
        pr = prompt.get_rect(center=(Config.WINDOW_WIDTH // 2, box_y - 35))
        self.screen.blit(prompt, pr)

        # 输入框背景
        border_color = Config.COLOR_INPUT_ACTIVE if (
            self.cursor_blink < 25) else Config.COLOR_INPUT_BORDER
        box_rect = pygame.Rect(box_x, box_y, box_w, box_h)
        pygame.draw.rect(self.screen, Config.COLOR_INPUT_BG, box_rect, border_radius=6)
        pygame.draw.rect(self.screen, border_color, box_rect, width=2, border_radius=6)

        # 输入文字 + 光标
        display_name = self.input_name
        if self.cursor_blink < 20:
            display_name += "▏"

        name_surf = self.font_medium.render(display_name, True, Config.COLOR_TEXT)
        # 居中
        ns_rect = name_surf.get_rect(
            center=(box_x + box_w // 2, box_y + box_h // 2))
        self.screen.blit(name_surf, ns_rect)

        # 确认提示
        confirm = self.font_small.render(
            "Enter 确认  |  ESC 跳过", True, Config.COLOR_TEXT_DIM)
        cr = confirm.get_rect(center=(Config.WINDOW_WIDTH // 2, box_y + box_h + 25))
        self.screen.blit(confirm, cr)

    # ── 排行榜面板 ───────────────────────────────────
    def _draw_leaderboard_panel(self, top_y: int = 180):
        """在指定位置绘制排行榜列表"""
        panel_w, panel_h = 380, 320
        panel_x = Config.WINDOW_WIDTH // 2 - panel_w // 2

        # 半透明背景面板
        panel = pygame.Surface((panel_w, panel_h), pygame.SRCALPHA)
        panel.fill((20, 20, 40, 200))
        pygame.draw.rect(panel, (80, 80, 120, 255), panel.get_rect(), width=2, border_radius=8)
        self.screen.blit(panel, (panel_x, top_y))

        # 标题
        header = self.font_medium.render("🏆 排行榜", True, Config.COLOR_ACCENT)
        hr = header.get_rect(center=(Config.WINDOW_WIDTH // 2, top_y + 25))
        self.screen.blit(header, hr)

        if not self.leaderboard.entries:
            empty = self.font_small.render("暂无记录", True, Config.COLOR_TEXT_DIM)
            er = empty.get_rect(center=(Config.WINDOW_WIDTH // 2, top_y + panel_h // 2))
            self.screen.blit(empty, er)
            return

        # 表头
        h_rank = self.font_small.render("排名", True, Config.COLOR_TEXT_DIM)
        h_name = self.font_small.render("玩家", True, Config.COLOR_TEXT_DIM)
        h_score = self.font_small.render("分数", True, Config.COLOR_TEXT_DIM)
        self.screen.blit(h_rank, (panel_x + 30, top_y + 55))
        self.screen.blit(h_name, (panel_x + 100, top_y + 55))
        self.screen.blit(h_score, (panel_x + 280, top_y + 55))

        # 分隔线
        y_line = top_y + 78
        pygame.draw.line(self.screen, (60, 60, 80),
                         (panel_x + 20, y_line),
                         (panel_x + panel_w - 20, y_line))

        # 条目
        start_y = top_y + 85
        for i, entry in enumerate(self.leaderboard.entries):
            y = start_y + i * 28

            # 高亮当前分数
            is_highlight = hasattr(self, '_highlight_rank') and self._highlight_rank == i
            if is_highlight:
                hl_rect = pygame.Rect(panel_x + 15, y - 2, panel_w - 30, 26)
                pygame.draw.rect(self.screen, (60, 60, 100), hl_rect, border_radius=4)

            # 排名图标
            rank_color = Config.COLOR_TEXT
            if i == 0:
                rank_str = "🥇"
            elif i == 1:
                rank_str = "🥈"
            elif i == 2:
                rank_str = "🥉"
            else:
                rank_str = f"  {i + 1}"
                rank_color = Config.COLOR_TEXT_DIM

            rank_surf = self.font_small.render(rank_str, True, rank_color)
            self.screen.blit(rank_surf, (panel_x + 28, y))

            # 名字
            name_surf = self.font_small.render(
                entry["name"][:Config.MAX_NAME_LENGTH], True,
                Config.COLOR_ACCENT if is_highlight else Config.COLOR_TEXT)
            self.screen.blit(name_surf, (panel_x + 100, y))

            # 分数
            score_surf = self.font_small.render(
                str(entry["score"]), True,
                Config.COLOR_ACCENT if is_highlight else Config.COLOR_TEXT)
            self.screen.blit(score_surf, (panel_x + 280, y))

    # ── 排行榜全屏页面 ──────────────────────────────
    def _draw_leaderboard_page(self):
        self.screen.fill(Config.COLOR_BG)

        # 标题
        title = self.font_title.render("🏆 排行榜", True, Config.COLOR_ACCENT)
        tr = title.get_rect(center=(Config.WINDOW_WIDTH // 2, 50))
        self.screen.blit(title, tr)

        if not self.leaderboard.entries:
            empty = self.font_large.render("暂无记录", True, Config.COLOR_TEXT_DIM)
            er = empty.get_rect(center=(Config.WINDOW_WIDTH // 2, Config.WINDOW_HEIGHT // 2))
            self.screen.blit(empty, er)
        else:
            # 居中绘制排行榜
            col_w = [60, 200, 100]
            total_w = sum(col_w)
            start_x = (Config.WINDOW_WIDTH - total_w) // 2 + 40

            # 表头
            for j, (txt, w) in enumerate(zip(["排名", "玩家", "分数"], col_w)):
                hdr = self.font_medium.render(txt, True, Config.COLOR_TEXT_DIM)
                self.screen.blit(hdr, (start_x + sum(col_w[:j]), 110))

            pygame.draw.line(self.screen, (60, 60, 80),
                             (start_x - 10, 145),
                             (start_x + total_w + 10, 145), width=2)

            for i, entry in enumerate(self.leaderboard.entries):
                y = 165 + i * 40

                # 背景条纹
                if i % 2 == 0:
                    stripe = pygame.Rect(start_x - 10, y - 3, total_w + 20, 36)
                    pygame.draw.rect(self.screen, (25, 25, 40), stripe, border_radius=4)

                # 排名
                if i == 0:
                    r = "🥇 1"
                elif i == 1:
                    r = "🥈 2"
                elif i == 2:
                    r = "🥉 3"
                else:
                    r = f"   {i + 1}"

                rank_s = self.font_medium.render(r, True, Config.COLOR_TEXT)
                self.screen.blit(rank_s, (start_x, y))

                # 名字
                name_s = self.font_medium.render(
                    entry["name"][:Config.MAX_NAME_LENGTH], True, Config.COLOR_TEXT)
                self.screen.blit(name_s, (start_x + col_w[0], y))

                # 分数
                score_s = self.font_medium.render(
                    str(entry["score"]), True, Config.COLOR_ACCENT)
                self.screen.blit(score_s, (start_x + col_w[0] + col_w[1], y))

        # 底部提示
        hint = self.font_small.render(
            "按 L 返回游戏  |  按 R 开始新游戏  |  按 ESC 退出",
            True, Config.COLOR_TEXT_DIM)
        hr = hint.get_rect(center=(Config.WINDOW_WIDTH // 2, Config.WINDOW_HEIGHT - 30))
        self.screen.blit(hint, hr)

    # ── 当前速度 ────────────────────────────────────────
    def _current_fps(self) -> int:
        bonus = self.score // 50
        return min(self.base_fps + bonus, Config.MAX_FPS)

    # ── 主循环 ──────────────────────────────────────────
    def run(self):
        running = True
        while running:
            running = self.handle_events()
            self.update()
            self.draw()
            self.clock.tick(self._current_fps())

        pygame.quit()
        sys.exit()


# ── 入口 ──────────────────────────────────────────────────
if __name__ == "__main__":
    game = SnakeGame()
    game.run()
