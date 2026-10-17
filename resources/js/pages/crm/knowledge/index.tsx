import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { DeskShell } from '@/components/crm/desk-shell';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';
import { Textarea } from '@/evo/ui/textarea';
import { t } from '@/lib/i18n';

type KnowledgeArticle = {
    id: number;
    title: string;
    slug: string;
    category: string;
    excerpt?: string | null;
    body: string;
    tags: string[];
    status: 'draft' | 'published';
    published_at?: string | null;
    updated_at?: string | null;
    updated_by?: string | null;
};

export default function KnowledgeBaseIndex({
    articles,
    query,
    canManage,
    selectedArticleId,
}: {
    articles: KnowledgeArticle[];
    query: string;
    canManage: boolean;
    selectedArticleId?: number | null;
}) {
    const [selectedId, setSelectedId] = useState<number | null>(
        selectedArticleId ?? articles[0]?.id ?? null,
    );
    const selected =
        articles.find((article) => article.id === selectedId) ?? null;

    return (
        <DeskShell title="Knowledge base">
            <Head title={t('Knowledge base')} />
            <div className="h-full overflow-auto bg-[var(--evo-canvas)]">
                <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
                    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-[20px] font-semibold tracking-tight text-[var(--evo-ink)]">
                                {t('Knowledge base')}
                            </h1>
                            <p className="mt-1 text-[13px] text-[var(--evo-ink-secondary)]">
                                {t(
                                    'Keep approved answers and support guidance close to every ticket.',
                                )}
                            </p>
                        </div>
                        <Form
                            action="/crm/knowledge"
                            method="get"
                            className="flex gap-2"
                        >
                            <Input
                                name="q"
                                defaultValue={query}
                                placeholder={t('Search articles')}
                                className="h-9 w-56"
                            />
                            <Button type="submit" variant="outline" size="sm">
                                {t('Search')}
                            </Button>
                        </Form>
                    </header>

                    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                        <section className="rounded-md border border-hairline bg-[var(--evo-surface)]">
                            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                                <div>
                                    <h2 className="text-[13px] font-semibold text-ink">
                                        {t('Articles')}
                                    </h2>
                                    <p className="mt-0.5 text-[12px] text-mute">
                                        {articles.length} {t('available')}
                                    </p>
                                </div>
                                {canManage ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setSelectedId(null)}
                                    >
                                        {t('New article')}
                                    </Button>
                                ) : null}
                            </div>
                            <div className="divide-y divide-hairline">
                                {articles.length === 0 ? (
                                    <p className="px-4 py-6 text-[13px] text-mute">
                                        {t(
                                            'No knowledge articles match this search.',
                                        )}
                                    </p>
                                ) : (
                                    articles.map((article) => (
                                        <button
                                            key={article.id}
                                            type="button"
                                            className={`block w-full px-4 py-3 text-left hover:bg-canvas-soft ${selectedId === article.id ? 'bg-canvas-soft' : ''}`}
                                            onClick={() =>
                                                setSelectedId(article.id)
                                            }
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-[13px] font-medium text-ink">
                                                    {article.title}
                                                </p>
                                                {article.status === 'draft' ? (
                                                    <span className="text-[10px] text-mute">
                                                        {t('Draft')}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="mt-1 text-[11px] text-mute">
                                                {article.category}
                                                {article.tags.length > 0
                                                    ? ` · ${article.tags.slice(0, 2).join(', ')}`
                                                    : ''}
                                            </p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </section>

                        {canManage ? (
                            <ArticleEditor
                                article={selected}
                                onCreated={setSelectedId}
                            />
                        ) : selected ? (
                            <ArticleReader article={selected} />
                        ) : (
                            <div className="rounded-md border border-hairline bg-[var(--evo-surface)] p-6 text-[13px] text-mute">
                                {t('Select an article to read it.')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DeskShell>
    );
}

function ArticleEditor({
    article,
    onCreated,
}: {
    article: KnowledgeArticle | null;
    onCreated: (id: number | null) => void;
}) {
    const action = article ? `/crm/knowledge/${article.id}` : '/crm/knowledge';

    return (
        <section className="rounded-md border border-hairline bg-[var(--evo-surface)] p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-[14px] font-semibold text-ink">
                        {article ? t('Edit article') : t('New article')}
                    </h2>
                    <p className="mt-1 text-[12px] text-mute">
                        {t(
                            'Drafts stay internal; publish only answers that are ready for agents.',
                        )}
                    </p>
                </div>
                {article ? (
                    <Form
                        action={`/crm/knowledge/${article.id}`}
                        method="delete"
                        options={{ preserveScroll: true }}
                    >
                        <Button type="submit" variant="ghost" size="sm">
                            {t('Delete')}
                        </Button>
                    </Form>
                ) : null}
            </div>
            <Form
                key={article?.id ?? 'new'}
                action={action}
                method={article ? 'put' : 'post'}
                options={{ preserveScroll: true }}
                onSuccess={() => onCreated(article?.id ?? null)}
                className="space-y-3"
            >
                {({ processing, errors }) => (
                    <>
                        <div>
                            <Label htmlFor="knowledge-title">
                                {t('Title')}
                            </Label>
                            <Input
                                id="knowledge-title"
                                name="title"
                                defaultValue={article?.title ?? ''}
                                className="mt-1"
                                required
                            />
                            {errors.title ? (
                                <p className="mt-1 text-[11px] text-destructive">
                                    {errors.title}
                                </p>
                            ) : null}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="knowledge-category">
                                    {t('Category')}
                                </Label>
                                <Input
                                    id="knowledge-category"
                                    name="category"
                                    defaultValue={
                                        article?.category ?? 'General'
                                    }
                                    className="mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="knowledge-tags">
                                    {t('Tags')}
                                </Label>
                                <Input
                                    id="knowledge-tags"
                                    name="tags"
                                    defaultValue={
                                        article?.tags.join(', ') ?? ''
                                    }
                                    className="mt-1"
                                    placeholder={t('billing, setup, WhatsApp')}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="knowledge-excerpt">
                                {t('Short answer')}
                            </Label>
                            <Input
                                id="knowledge-excerpt"
                                name="excerpt"
                                defaultValue={article?.excerpt ?? ''}
                                className="mt-1"
                                maxLength={500}
                            />
                        </div>
                        <div>
                            <Label htmlFor="knowledge-body">
                                {t('Article')}
                            </Label>
                            <Textarea
                                id="knowledge-body"
                                name="body"
                                defaultValue={article?.body ?? ''}
                                className="mt-1 min-h-64"
                                required
                            />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
                            <select
                                name="status"
                                defaultValue={article?.status ?? 'draft'}
                                className="h-9 rounded-md border bg-background px-2 text-sm"
                            >
                                <option value="draft">{t('Draft')}</option>
                                <option value="published">
                                    {t('Published')}
                                </option>
                            </select>
                            <Button type="submit" disabled={processing}>
                                {processing ? t('Saving…') : t('Save article')}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </section>
    );
}

function ArticleReader({ article }: { article: KnowledgeArticle }) {
    return (
        <article className="rounded-md border border-hairline bg-[var(--evo-surface)] p-5">
            <p className="text-[11px] font-medium tracking-wide text-mute uppercase">
                {article.category}
            </p>
            <h2 className="mt-2 text-[20px] font-semibold text-ink">
                {article.title}
            </h2>
            {article.excerpt ? (
                <p className="mt-2 text-[14px] text-mute">{article.excerpt}</p>
            ) : null}
            <div className="mt-5 text-[13px] leading-6 whitespace-pre-wrap text-ink">
                {article.body}
            </div>
            {article.tags.length > 0 ? (
                <p className="mt-6 text-[11px] text-mute">
                    {article.tags.join(' · ')}
                </p>
            ) : null}
        </article>
    );
}

KnowledgeBaseIndex.layout = {
    breadcrumbs: [{ title: 'Knowledge base', href: '/crm/knowledge' }],
};
