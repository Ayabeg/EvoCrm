import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { settingsCopy } from './copy';

/**
 * Blocks Inertia visits and browser unload while a settings form is dirty.
 */
export function useUnsavedChangesGuard(dirty: boolean, message = settingsCopy.unsaved): void {
    useEffect(() => {
        if (!dirty) {
            return;
        }

        const onBefore = (event: { preventDefault: () => void }) => {
            if (!window.confirm(message)) {
                event.preventDefault();
            }
        };

        const onUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = message;
        };

        const remove = router.on('before', onBefore);
        window.addEventListener('beforeunload', onUnload);

        return () => {
            remove();
            window.removeEventListener('beforeunload', onUnload);
        };
    }, [dirty, message]);
}
