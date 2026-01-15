import React from 'react';
import ThemeToggle from '../ThemeToggle';
import { Plus, Minus, RotateCcw, RotateCw, User, Crosshair } from 'lucide-react';
import TopNav from './TopNav';
import FloatingIsland from './FloatingIsland';
import MinimalWatermark from './MinimalWatermark';

type Props = {
    userName: string;
    onProfile: () => void;

    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;

    onCenter: () => void;
    disableCenter: boolean;

    onZoomOut: () => void;
    onZoomIn: () => void;
    zoomPct: number;
};

const OverlayHUD: React.FC<Props> = (props) => {
    return (
        // data-overlay used by canvas to ignore pointerdown from overlays
        <div
            data-overlay="true"
            className="fixed inset-0 z-[9999] pointer-events-none"
            // critical: stop pointer events from bubbling into <main> handlers
            onPointerDownCapture={(e) => e.stopPropagation()}
            onPointerMoveCapture={(e) => e.stopPropagation()}
            onPointerUpCapture={(e) => e.stopPropagation()}
            onWheelCapture={(e) => e.stopPropagation()}
        >
            <TopNav userName={props.userName} onProfile={props.onProfile} />

            <FloatingIsland
                canUndo={props.canUndo}
                canRedo={props.canRedo}
                onUndo={props.onUndo}
                onRedo={props.onRedo}
                onCenter={props.onCenter}
                disableCenter={props.disableCenter}
                onZoomOut={props.onZoomOut}
                onZoomIn={props.onZoomIn}
                zoomPct={props.zoomPct}
            />

            <MinimalWatermark />
        </div>
    );
};

export default OverlayHUD;
