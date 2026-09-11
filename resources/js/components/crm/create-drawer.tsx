import type { ReactNode } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function CreateDrawer({
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
    showFormLink = true,
    className,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    showFormLink?: boolean;
    className?: string;
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className={cn(
                    'w-full gap-0 border-l border-hairline bg-canvas p-0 sm:max-w-md',
                    className,
                )}
            >
                <SheetHeader className="relative border-b border-hairline px-5 py-3 text-left">
                    <span
                        className="absolute inset-y-0 left-0 w-[3px] bg-[var(--evosales-mark,#EC6025)]"
                        aria-hidden
                    />
                    <div className="flex items-start justify-between gap-3 pr-6">
                        <div>
                            <SheetTitle className="text-[15px] font-semibold tracking-tight text-ink">
                                {title}
                            </SheetTitle>
                            {description ? (
                                <SheetDescription className="mt-1 text-[12px] text-mute">
                                    {description}
                                </SheetDescription>
                            ) : null}
                        </div>
                        {showFormLink ? (
                            <a
                                href="#edit-form"
                                className="shrink-0 text-[12px] font-medium text-brand"
                            >
                                Edit this form
                            </a>
                        ) : null}
                    </div>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    {children}
                </div>
                {footer ? (
                    <SheetFooter className="flex-row justify-end gap-2 border-t border-hairline bg-canvas px-5 py-3">
                        {footer}
                    </SheetFooter>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}
