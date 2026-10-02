/**
 * Evo Design System — RichTextEditor
 * Registry: Tiptap starter-kit (OSS)
 * Source: https://tiptap.dev · https://github.com/ueberdosis/tiptap
 * License: MIT (package.json, verified 2026-10-02)
 * Copied: 2026-10-02
 * Modified: Phosphor toolbar; Evo tokens; French labels; no Tiptap Pro / Cloud.
 */

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { List, ListNumbers, TextB, TextItalic } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import { t } from '@/lib/i18n';

export type RichTextEditorProps = {
    value: string;
    onChange: (html: string, text: string) => void;
    placeholder?: string;
    name?: string;
    id?: string;
    className?: string;
};

function ToolbarButton({
    pressed,
    label,
    onClick,
    children,
}: {
    pressed?: boolean;
    label: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={pressed}
            onClick={onClick}
            className={cn(
                'inline-flex size-8 items-center justify-center rounded-[var(--evo-radius-compact)] text-[var(--evo-ink)]',
                'hover:bg-[var(--evo-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)]',
                pressed && 'bg-[var(--evo-teal-soft)] text-[var(--evo-teal)]',
            )}
        >
            {children}
        </button>
    );
}

export function RichTextEditor({
    value,
    onChange,
    placeholder,
    name,
    id,
    className,
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [StarterKit],
        content: value || '',
        editorProps: {
            attributes: {
                class: 'min-h-40 px-3 py-2 text-[13px] text-[var(--evo-ink)] outline-none [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
                'aria-label': t('Rich text editor'),
                id: id ?? 'rich-text-editor',
            },
        },
        onUpdate: ({ editor: instance }) => {
            onChange(instance.getHTML(), instance.getText());
        },
    });

    useEffect(() => {
        if (!editor) {
            return;
        }

        if (value !== editor.getHTML()) {
            editor.commands.setContent(value || '', { emitUpdate: false });
        }
    }, [editor, value]);

    if (!editor) {
        return (
            <div
                className={cn(
                    'min-h-40 rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline-strong)] bg-[var(--evo-surface)]',
                    className,
                )}
            />
        );
    }

    return (
        <div
            className={cn(
                'overflow-hidden rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline-strong)] bg-[var(--evo-surface)]',
                'focus-within:ring-2 focus-within:ring-[var(--evo-focus)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--evo-canvas)]',
                className,
            )}
        >
            <div className="flex items-center gap-0.5 border-b border-[var(--evo-hairline)] px-1 py-1">
                <ToolbarButton
                    label={t('Bold')}
                    pressed={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <TextB className="size-4" weight="bold" aria-hidden />
                </ToolbarButton>
                <ToolbarButton
                    label={t('Italic')}
                    pressed={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <TextItalic className="size-4" aria-hidden />
                </ToolbarButton>
                <ToolbarButton
                    label={t('Bullet list')}
                    pressed={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="size-4" aria-hidden />
                </ToolbarButton>
                <ToolbarButton
                    label={t('Numbered list')}
                    pressed={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListNumbers className="size-4" aria-hidden />
                </ToolbarButton>
            </div>
            <EditorContent editor={editor} />
            {name ? <input type="hidden" name={name} value={value} /> : null}
            {placeholder && editor.isEmpty ? (
                <span className="sr-only">{placeholder}</span>
            ) : null}
        </div>
    );
}

export default RichTextEditor;
