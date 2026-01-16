import React from "react";
import { NodeData } from "../types";

type Props = {
  parent: NodeData;
  child: NodeData;
  isHighlighted?: boolean;

  /**
   * IMPORTANT:
   * These must match your rendered node dimensions (BubbleNode container).
   * If your nodes are responsive or variable-height, see note below on measuring DOM.
   */
  nodeWidth?: number;
  nodeHeight?: number;

  /** Small gap so line doesn't visually touch the node border */
  anchorPadding?: number;
};

function getCenter(node: NodeData, w: number, h: number) {
  return {
    cx: node.position.x + w / 2,
    cy: node.position.y + h / 2,
  };
}

function getAnchorPoint(
  from: NodeData,
  to: NodeData,
  w: number,
  h: number,
  pad: number
) {
  const { cx: fx, cy: fy } = getCenter(from, w, h);
  const { cx: tx, cy: ty } = getCenter(to, w, h);

  const dx = tx - fx;
  const dy = ty - fy;

  // Decide which side to exit based on dominant direction.
  // If mostly vertical -> top/bottom. If mostly horizontal -> left/right.
  if (Math.abs(dy) >= Math.abs(dx)) {
    // Vertical connection
    if (dy >= 0) {
      // to is below from => exit bottom
      return { x: fx, y: from.position.y + h + pad };
    } else {
      // to is above from => exit top
      return { x: fx, y: from.position.y - pad };
    }
  } else {
    // Horizontal connection
    if (dx >= 0) {
      // to is right of from => exit right
      return { x: from.position.x + w + pad, y: fy };
    } else {
      // to is left of from => exit left
      return { x: from.position.x - pad, y: fy };
    }
  }
}

const Connection: React.FC<Props> = ({
  parent,
  child,
  isHighlighted,
  nodeWidth = 280,   // <-- set these to your actual node size
  nodeHeight = 140,  // <-- set these to your actual node size
  anchorPadding = 6,
}) => {
  // Start at parent edge facing child, end at child edge facing parent
  const start = getAnchorPoint(parent, child, nodeWidth, nodeHeight, anchorPadding);
  const end = getAnchorPoint(child, parent, nodeWidth, nodeHeight, anchorPadding);

  const x1 = start.x;
  const y1 = start.y;
  const x2 = end.x;
  const y2 = end.y;

  // Curve control points:
  // Bias control points along the dominant axis for smoother routing.
  const dx = x2 - x1;
  const dy = y2 - y1;

  const curvature = 0.35; // tweak 0.25–0.45
  let cp1x = x1;
  let cp1y = y1;
  let cp2x = x2;
  let cp2y = y2;

  if (Math.abs(dy) >= Math.abs(dx)) {
    // Mostly vertical: bend in Y
    cp1y = y1 + dy * curvature;
    cp2y = y2 - dy * curvature;
  } else {
    // Mostly horizontal: bend in X
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
