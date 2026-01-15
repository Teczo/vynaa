import React from 'react';
import { NodeData } from '../types';

const Connection: React.FC<{ parent: NodeData; child: NodeData; isHighlighted?: boolean }> = ({
  parent,
  child,
  isHighlighted,
}) => {
  const x1 = parent.position.x;
  const y1 = parent.position.y;
  const x2 = child.position.x;
  const y2 = child.position.y;

  // Slight curve
  const dx = Math.abs(x2 - x1);
  const cp1x = x1 + dx * 0.35;
  const cp2x = x2 - dx * 0.35;

  const d = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;

  return (
    <path
      d={d}
      fill="none"
      className={
        isHighlighted
          ? 'stroke-zinc-500/80 dark:stroke-white/40'
          : 'stroke-zinc-400/50 dark:stroke-white/18'
      }
      strokeWidth={2}
      strokeLinecap="round"
    />
  );
};

export default Connection;
