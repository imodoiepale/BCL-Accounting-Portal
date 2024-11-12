// /core/realtime/useRealtimeUpdates.ts
import { useEffect, useRef } from 'react';
import { RealtimeManager } from './RealtimeManager';

export const useRealtimeUpdates = (
    configId: string,
    tables: string[],
    onUpdate: (table: string, payload: any) => void
) => {
    const realtimeManager = useRef<RealtimeManager>();

    useEffect(() => {
        realtimeManager.current = new RealtimeManager(configId);

        tables.forEach(table => {
            realtimeManager.current!.subscribeToChanges(table, (payload: any) => {
                onUpdate(table, payload);
            });
        });

        return () => {
            tables.forEach(table => {
                realtimeManager.current!.unsubscribe(table, onUpdate);
            });
        };
    }, [configId, tables]);
};