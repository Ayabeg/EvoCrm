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
                <SheetHeader className="border-b border-hairline px-5 py-4 text-left">
                    <div className="flex items-start justify-between gap-3 pr-6">
                        <div>
                            <SheetTitle className="aurora-text-display-2 text-ink">
                                {title}
                            </SheetTitle>
                            {description ? (
                                <SheetDescription className="aurora-text-caption mt-1 text-mute">
                                    {description}
                                </SheetDescription>
                            ) : null}
                        </div>
                        {showFormLink ? (
                            <a
                                href="#edit-form"
                                className="aurora-text-caption shrink-0 font-medium text-brand"
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
