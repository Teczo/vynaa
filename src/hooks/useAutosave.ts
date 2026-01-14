import { useEffect, useRef, useState } from 'react';

// Simple deep comparison for dependencies or rely on reference change if immutable
export function useAutosave(
    conversationId: string | null,
    data: { nodes: any[]; viewport: any },
    debounceMs: number = 2000
) {
    const [saving, setSaving] = useState(false);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    // No-op: Turns are saved immediately via API
    return { saving: false, lastSynced: new Date() };
}
