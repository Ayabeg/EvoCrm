import { Monitor, Moon, Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

const tabs: { value: Appearance; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
];

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <div className={cn('space-y-3', className)} {...props}>
            <div
                className="inline-flex gap-1 rounded-lg border border-hairline bg-canvas-soft p-1"
                role="group"
                aria-label="Appearance"
            >
                {tabs.map(({ value, icon: Icon, label }) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => updateAppearance(value)}
                        aria-pressed={appearance === value}
                        data-test={`appearance-${value}`}
                        className={cn(
                            'flex items-center rounded-md px-3.5 py-1.5 transition-colors',
                            appearance === value
                                ? 'bg-canvas text-ink shadow-xs'
                                : 'text-mute hover:bg-canvas/60 hover:text-ink',
                        )}
                    >
                        <Icon
                            className={cn(
                                '-ml-1 h-4 w-4',
                                appearance === value && 'text-brand',
                            )}
                        />
                        <span className="ml-1.5 text-sm">{label}</span>
                    </button>
                ))}
            </div>
            <p className="text-sm text-muted-foreground">
                Light Cabinet is the white Sales Hub face. Dark Cabinet is true
                black — canvas #000000, cards #0A0A0A — with the same Evotechly
                orange actions. System follows your device.
            </p>
        </div>
    );
}
