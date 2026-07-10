/**
 * Emoji 选择器
 * 用 Popover 包裹 emoji 网格，点击选择
 */
import React, { useState } from 'react';
import { Popover, Button } from 'antd';

const COMMON_EMOJIS = [
  '🍜', '🚗', '🛒', '🏠', '🎮', '💊', '📚', '🎁', '📦',
  '🍔', '☕', '🍺', '🎂', '🍕', '🌮', '🥗',
  '✈️', '🚌', '🚲', '⛽', '🅿️',
  '👕', '👟', '👗', '💄', '👶',
  '💻', '📱', '📷', '🎧', '🖥️',
  '🏥', '💉', '🏋️', '🧘',
  '🎓', '📖', '✏️', '📝',
  '🎬', '🎤', '🎵', '🎨', '🏀', '⚽',
  '🐱', '🐶', '🐰', '🌸', '🌿', '💡',
  '💰', '💳', '🏦', '📊', '📋',
  '🎯', '⭐', '🔥', '💎', '🔧', '📌',
  '🧹', '🛁', '🍼', '🎒', '🚿', '🔋',
];

interface EmojiPickerProps {
  value?: string;
  onChange?: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomLeft"
      content={
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            width: 308,
            gap: 4,
            maxWidth: 'calc(100vw - 48px)',
          }}
        >
          {COMMON_EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              type={value === emoji ? 'primary' : 'text'}
              style={{ fontSize: 22, width: 40, height: 40, padding: 0 }}
              onClick={() => {
                onChange?.(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </Button>
          ))}
        </div>
      }
    >
      <Button style={{ fontSize: 28, width: 56, height: 56 }}>
        {value || '😀'}
      </Button>
    </Popover>
  );
};

export default EmojiPicker;
