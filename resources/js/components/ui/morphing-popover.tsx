import {
    AnimatePresence,
    MotionConfig,
    motion,
    useReducedMotion,
    type Transition,
} from 'motion/react';
import {
    createContext,
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
    type ReactNode,
    type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

const SPRING: Transition = {
    type: 'spring',
    bounce: 0.1,
    duration: 0.4,
};

type MorphingPopoverContextValue = {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
    uniqueId: string;
    triggerRef: RefObject<HTMLButtonElement | null>;
};

const MorphingPopoverContext = createContext<MorphingPopoverContextValue | null>(null);

export function MorphingPopover({
    children,
    open,
    defaultOpen = false,
    onOpenChange,
    className,
}: {
    children: ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
}) {
    const uniqueId = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : uncontrolledOpen;
    const reduce = useReducedMotion();

    const setOpen = (next: boolean) => {
        if (!isControlled) {
            setUncontrolledOpen(next);
        }
        onOpenChange?.(next);
    };

    const value: MorphingPopoverContextValue = {
        isOpen,
        open: () => setOpen(true),
        close: () => setOpen(false),
        toggle: () => setOpen(!isOpen),
        uniqueId,
        triggerRef,
    };

    return (
        <MorphingPopoverContext.Provider value={value}>
            <MotionConfig transition={reduce ? { duration: 0 } : SPRING}>
                <div className={cn('relative inline-flex', className)}>{children}</div>
            </MotionConfig>
        </MorphingPopoverContext.Provider>
    );
}

export function MorphingPopoverTrigger({
    children,
    className,
    ...props
}: React.ComponentProps<typeof motion.button> & {
    'data-test'?: string;
}) {
    const context = useContext(MorphingPopoverContext);
    if (!context) {
        throw new Error('MorphingPopoverTrigger must be used within MorphingPopover');
    }

    return (
        <motion.button
            {...props}
            ref={context.triggerRef}
            type="button"
            layoutId={`popover-trigger-${context.uniqueId}`}
            onClick={context.toggle}
            className={className}
            style={{ borderRadius: 6 }}
            aria-expanded={context.isOpen}
            aria-controls={`popover-content-${context.uniqueId}`}
        >
            {children}
        </motion.button>
    );
}

export function MorphingPopoverContent({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    const context = useContext(MorphingPopoverContext);
    if (!context) {
        throw new Error('MorphingPopoverContent must be used within MorphingPopover');
    }

    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!context.isOpen) {
            return;
        }

        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node | null;
            if (!target) {
                return;
            }
            if (contentRef.current?.contains(target)) {
                return;
            }
            if (context.triggerRef.current?.contains(target)) {
                return;
            }
            context.close();
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                context.close();
            }
        };

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [context.isOpen, context.close, context.triggerRef]);

    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <AnimatePresence>
            {context.isOpen ? (
                <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <motion.div
                        ref={contentRef}
                        layoutId={`popover-trigger-${context.uniqueId}`}
                        id={`popover-content-${context.uniqueId}`}
                        role="dialog"
                        aria-modal="true"
                        className={cn(
                            'pointer-events-auto flex max-h-[min(80vh,720px)] w-full max-w-[440px] flex-col overflow-hidden rounded-md border border-hairline bg-canvas text-ink shadow-md',
                            className,
                        )}
                        style={{ borderRadius: 6 }}
                    >
                        {children}
                    </motion.div>
                </div>
            ) : null}
        </AnimatePresence>,
        document.body,
    );
}
