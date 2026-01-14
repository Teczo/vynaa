import { useState, useCallback } from 'react';

export function useUndo<T>(initialState: T, maxHistory: number = 50) {
    const [past, setPast] = useState<T[]>([]);
    const [future, setFuture] = useState<T[]>([]);
    const [current, setCurrent] = useState<T>(initialState);

    const set = useCallback((newState: T | ((prev: T) => T)) => {
        setCurrent((prev) => {
            const resolvedState = typeof newState === 'function' ? (newState as Function)(prev) : newState;

            if (prev !== resolvedState) {
                setPast((p) => {
                    const newPast = [...p, prev];
                    if (newPast.length > maxHistory) {
                        return newPast.slice(newPast.length - maxHistory);
                    }
                    return newPast;
                });
                setFuture([]); // Clear redo stack on new change
            }

            return resolvedState;
        });
    }, [maxHistory]);

    // External set without recording history (e.g. for loading from server)
    const reset = useCallback((newState: T) => {
        setCurrent(newState);
        setPast([]);
        setFuture([]);
    }, []);

    const setWithoutHistory = useCallback((newState: T | ((prev: T) => T)) => {
        setCurrent((prev) => {
            const resolvedState = typeof newState === 'function' ? (newState as Function)(prev) : newState;
            return resolvedState;
        });
    }, []);

    const undo = useCallback(() => {
        setPast((p) => {
            if (p.length === 0) return p;
            const previous = p[p.length - 1];
            const newPast = p.slice(0, p.length - 1);

            setFuture((f) => [current, ...f]);
            setCurrent(previous);

            return newPast;
        });
    }, [current]);

    const redo = useCallback(() => {
        setFuture((f) => {
            if (f.length === 0) return f;
            const next = f[0];
            const newFuture = f.slice(1);

            setPast((p) => [...p, current]);
            setCurrent(next);

            return newFuture;
        });
    }, [current]);

    return {
        state: current,
        setState: set,
        setWithoutHistory,
        reset,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0
    };
}
