import type { ConnectorStatus } from '@/types';

export function connectorStatusLabel(status: ConnectorStatus): string {
    if (status === 'connected') {
        return 'Connected';
    }

    if (status === 'needs_token') {
        return 'Needs official token';
    }

    if (status === 'needs_reconnect') {
        return 'Reconnect Google';
    }

    return 'Not connected';
}
