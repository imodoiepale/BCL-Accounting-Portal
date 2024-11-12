
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export class RealtimeManager {
    private channels: Map<string, RealtimeChannel> = new Map();
    private subscriptions: Map<string, Function[]> = new Map();

    constructor(private configId: string) { }

    subscribeToChanges(table: string, callback: Function) {
        if (!this.channels.has(table)) {
            const channel = this.setupRealtimeChannel(table);
            this.channels.set(table, channel);
        }

        if (!this.subscriptions.has(table)) {
            this.subscriptions.set(table, []);
        }
        this.subscriptions.get(table)!.push(callback);
    }

    private setupRealtimeChannel(table: string): RealtimeChannel {
        const channel = supabase
            .channel(`table-updates-${table}`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table,
                    filter: `config_id=eq.${this.configId}`
                },
                (payload) => this.handleRealtimeUpdate(table, payload)
            )
            .subscribe();

        return channel;
    }

    private handleRealtimeUpdate(table: string, payload: any) {
        const callbacks = this.subscriptions.get(table) || [];
        callbacks.forEach(callback => callback(payload));
    }

    unsubscribe(table: string, callback: Function) {
        const callbacks = this.subscriptions.get(table) || [];
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }

        if (callbacks.length === 0) {
            const channel = this.channels.get(table);
            if (channel) {
                channel.unsubscribe();
                this.channels.delete(table);
            }
            this.subscriptions.delete(table);
        }
    }
}