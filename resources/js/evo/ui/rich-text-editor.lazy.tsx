import { lazy, Suspense } from 'react';
import type { RichTextEditorProps } from '@/evo/ui/rich-text-editor';
import { SkeletonRow } from '@/evo/ui/skeleton';

const Editor = lazy(() => import('@/evo/ui/rich-text-editor'));

export function LazyRichTextEditor(props: RichTextEditorProps) {
    return (
        <Suspense fallback={<SkeletonRow />}>
            <Editor {...props} />
        </Suspense>
    );
}
