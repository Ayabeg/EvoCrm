/**
 * Canonical application toast.
 *
 * Authority: EvoSales notifications (Inertia flash via `useFlashToast`)
 * use Sonner only. The second (Aurora) toast primitive was deleted in PR3.
 * Do not mount a second toaster.
 */
import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="bottom-right"
            duration={4000}
            toastOptions={{
                classNames: {
                    toast: 'aurora-toast-enter',
                },
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
