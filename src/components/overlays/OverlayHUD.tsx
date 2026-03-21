import React from 'react';
import TopNav from './TopNav';
import FloatingIsland from './FloatingIsland';
import MinimalWatermark from './MinimalWatermark';
import { AIConfig } from '../SettingsModal';

type Props = {
    userName: string;
    onProfile: () => void;
    onSettings: () => void;

    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;

    onCenter: () => void;
    disableCenter: boolean;

    onZoomOut: () => void;
    onZoomIn: () => void;
    zoomPct: number;

    aiConfig: AIConfig | null;
};

const OverlayHUD: React.FC<Props> = (props) => {
    return (
        <div
            data-overlay="true"
            className="fixed inset-0 z-[9999] pointer-events-none"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onPointerMoveCapture={(e) => e.stopPropagation()}
            onPointerUpCapture={(e) => e.stopPropagation()}
            onWheelCapture={(e) => e.stopPropagation()}
        >
            <TopNav
                userName={props.userName}
                onProfile={props.onProfile}
                onSettings={props.onSettings}
                aiConfig={props.aiConfig}
            />

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
