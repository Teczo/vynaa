import { useEffect, useRef, useState } from 'react';
import { conversations } from '../services/api';

// Simple deep comparison for dependencies or rely on reference change if immutable
export function useAutosave(
    conversationId: string | null,
    data: { nodes: any[]; viewport: any },
    debounceMs: number = 2000
) {
    const [saving, setSaving] = useState(false);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFirstRun = useRef(true);

    useEffect(() => {
        if (!conversationId) return;

        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setSaving(true);

        timeoutRef.current = setTimeout(async () => {
            try {
                // Prepare payload
                // In a real app, we might diff here to send patches
                await conversations.sync(conversationId, {
                    nodes: data.nodes,
                    viewport: data.viewport
                });
                setLastSynced(new Date());
            } catch (error) {
                console.error('Autosave failed:', error);
            } finally {
                setSaving(false);
            }
        }, debounceMs);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [conversationId, data.nodes, data.viewport, debounceMs]);

    return { saving, lastSynced };
}
