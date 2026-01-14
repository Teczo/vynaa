
import React from 'react';
import { NodeData } from '../types';

interface ConnectionProps {
  parent: NodeData;
  child: NodeData;
  isHighlighted: boolean;
}

const Connection: React.FC<ConnectionProps> = ({ parent, child, isHighlighted }) => {
  const pX = parent.position.x;
  const pY = parent.position.y;
  const cX = child.position.x;
  const cY = child.position.y;

  // Organically curved Bezier path
  const pathData = `M ${pX} ${pY} 
                    C ${pX + (cX - pX) * 0.4} ${pY}, 
                      ${pX + (cX - pX) * 0.6} ${cY}, 
                      ${cX} ${cY}`;

  return (
    <g className={`transition-all duration-300 ${isHighlighted ? 'opacity-100 scale-[1.02]' : 'opacity-60'}`}>
      <defs>
        <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Background thicker glow when highlighted */}
      {isHighlighted && (
        <path
          d={pathData}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="10"
          strokeLinecap="round"
          filter="url(#glow-strong)"
          className="opacity-40"
        />
      )}

      {/* Main Connection Line */}
      <path
        d={pathData}
        fill="none"
        stroke="url(#branch-gradient)"
        strokeWidth={isHighlighted ? "6" : "4"}
        strokeLinecap="round"
        filter="url(#branch-glow)"
        className="transition-all duration-300"
      />

      {/* Animated Flow Dot */}
      <circle r={isHighlighted ? "6" : "4"} fill="white" className="shadow-white shadow-2xl">
        <animateMotion
          path={pathData}
          dur={isHighlighted ? "1.5s" : "3s"}
          repeatCount="indefinite"
        />
      </circle>
      
      {/* Target marker */}
      <circle cx={cX} cy={cY} r="6" fill="#8b5cf6" className={`${isHighlighted ? 'opacity-100 scale-125' : 'opacity-30'} transition-all`} />
    </g>
  );
};

export default Connection;
