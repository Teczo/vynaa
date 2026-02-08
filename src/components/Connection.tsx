import React from "react";
import { NodeData } from "../types";

type Props = {
  parent: NodeData;
  child: NodeData;
  isHighlighted?: boolean;
  anchorPadding?: number;
};

const ROOT_RADIUS = 160; // w-80 = 320px → radius 160
const DEFAULT_SIZE = { w: 280, h: 140 };

function isRoot(node: NodeData) {
  return node.id === "root" || node.type === "root";
}

function getCenter(node: NodeData) {
  return { cx: node.position.x, cy: node.position.y };
}

/**
 * Returns the anchor point on a node's boundary in the direction of the target,
 * plus the outward tangent direction at that point.
 */
function getAnchorAndTangent(
  from: NodeData,
  to: NodeData,
  pad: number
): { x: number; y: number; tx: number; ty: number } {
  const { cx: fx, cy: fy } = getCenter(from);
  const { cx: tox, cy: toy } = getCenter(to);

  const dx = tox - fx;
  const dy = toy - fy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Fallback when nodes nearly overlap
  if (dist < 1) {
    return { x: fx, y: fy + pad, tx: 0, ty: 1 };
  }

  // --- Circle (root node) ---
  if (isRoot(from)) {
    const angle = Math.atan2(dy, dx);
    const r = ROOT_RADIUS + pad;
    return {
      x: fx + r * Math.cos(angle),
      y: fy + r * Math.sin(angle),
      tx: Math.cos(angle),
      ty: Math.sin(angle),
    };
  }

  // --- Rounded rectangle (non-root) ---
  const halfW = DEFAULT_SIZE.w / 2;
  const halfH = DEFAULT_SIZE.h / 2;

  // Angle from center to target vs the rectangle's diagonal
  const cornerAngle = Math.atan2(halfH, halfW);
  const absAngle = Math.atan2(Math.abs(dy), Math.abs(dx));

  if (absAngle <= cornerAngle) {
    // Ray hits the left or right edge
    const signX = dx >= 0 ? 1 : -1;
    const edgeX = fx + signX * (halfW + pad);
    const edgeY = fy + (halfW / Math.abs(dx)) * dy;
    return { x: edgeX, y: edgeY, tx: signX, ty: 0 };
  } else {
    // Ray hits the top or bottom edge
    const signY = dy >= 0 ? 1 : -1;
    const edgeY = fy + signY * (halfH + pad);
    const edgeX = fx + (halfH / Math.abs(dy)) * dx;
    return { x: edgeX, y: edgeY, tx: 0, ty: signY };
  }
}

const Connection: React.FC<Props> = ({
  parent,
  child,
  isHighlighted,
  anchorPadding = 6,
}) => {
  const start = getAnchorAndTangent(parent, child, anchorPadding);
  const end = getAnchorAndTangent(child, parent, anchorPadding);

  const { x: x1, y: y1 } = start;
  const { x: x2, y: y2 } = end;

  // Distance between anchors drives control-point offset
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const cpOffset = dist * 0.4;

  // Control points extend along each anchor's outward tangent
  const cp1x = x1 + start.tx * cpOffset;
  const cp1y = y1 + start.ty * cpOffset;
  const cp2x = x2 + end.tx * cpOffset;
  const cp2y = y2 + end.ty * cpOffset;

  const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

  return (
    <path
      d={d}
      fill="none"
      className={
        isHighlighted
          ? "stroke-zinc-500/80 dark:stroke-white/40"
          : "stroke-zinc-400/50 dark:stroke-white/18"
      }
      strokeWidth={2}
      strokeLinecap="round"
    />
  );
};

export default Connection;
