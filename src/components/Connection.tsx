import React from "react";
import { NodeData } from "../types";

type Props = {
  parent: NodeData;
  child: NodeData;
  isHighlighted?: boolean;

  nodeWidth?: number;
  nodeHeight?: number;

  anchorPadding?: number;
};

const ROOT_SIZE = { w: 320, h: 320 }; // matches w-80 h-80
const DEFAULT_SIZE = { w: 280, h: 140 };

function isRoot(node: NodeData) {
  return node.id === "root" || node.type === "root";
}

function getNodeSize(node: NodeData) {
  return isRoot(node) ? ROOT_SIZE : DEFAULT_SIZE;
}

// node.position is CENTER
function getCenter(node: NodeData) {
  return {
    cx: node.position.x,
    cy: node.position.y,
  };
}

function getAnchorPoint(
  from: NodeData,
  to: NodeData,
  pad: number
) {
  const { cx: fx, cy: fy } = getCenter(from);
  const { cx: tx, cy: ty } = getCenter(to);

  const { w, h } = getNodeSize(from);

  const dx = tx - fx;
  const dy = ty - fy;

  const halfW = w / 2;
  const halfH = h / 2;

  // Root prefers horizontal exits (builds to the right)
  if (isRoot(from)) {
    return {
      x: fx + halfW + pad,
      y: fy,
    };
  }

  // Normal directional logic
  if (Math.abs(dy) >= Math.abs(dx)) {
    // Vertical
    if (dy >= 0) {
      return { x: fx, y: fy + halfH + pad };
    } else {
      return { x: fx, y: fy - halfH - pad };
    }
  } else {
    // Horizontal
    if (dx >= 0) {
      return { x: fx + halfW + pad, y: fy };
    } else {
      return { x: fx - halfW - pad, y: fy };
    }
  }
}

const Connection: React.FC<Props> = ({
  parent,
  child,
  isHighlighted,
  anchorPadding = 6,
}) => {
  const start = getAnchorPoint(parent, child, anchorPadding);
  const end = getAnchorPoint(child, parent, anchorPadding);

  const { x: x1, y: y1 } = start;
  const { x: x2, y: y2 } = end;

  const dx = x2 - x1;
  const dy = y2 - y1;

  const curvature = 0.35;

  let cp1x = x1;
  let cp1y = y1;
  let cp2x = x2;
  let cp2y = y2;

  if (Math.abs(dy) >= Math.abs(dx)) {
    cp1y = y1 + dy * curvature;
    cp2y = y2 - dy * curvature;
  } else {
    cp1x = x1 + dx * curvature;
    cp2x = x2 - dx * curvature;
  }

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
