<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeArticle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class KnowledgeBaseController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $canManage = $request->user()->canPermission('desk.manage');
        $query = trim((string) $request->input('q', ''));

        $articles = KnowledgeArticle::query()
            ->forWorkspace($workspace)
            ->when(! $canManage, fn ($builder) => $builder->where('status', KnowledgeArticle::STATUS_PUBLISHED))
            ->when($query !== '', function ($builder) use ($query): void {
                $builder->where(function ($nested) use ($query): void {
                    $nested->where('title', 'like', '%'.$query.'%')
                        ->orWhere('excerpt', 'like', '%'.$query.'%')
                        ->orWhere('body', 'like', '%'.$query.'%')
                        ->orWhereJsonContains('tags', $query);
                });
            })
            ->with(['createdBy', 'updatedBy'])
            ->orderByDesc('published_at')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (KnowledgeArticle $article): array => $this->present($article))
            ->values()
            ->all();

        return Inertia::render('crm/knowledge/index', [
            'articles' => $articles,
            'query' => $query,
            'canManage' => $canManage,
            'selectedArticleId' => $request->integer('article') ?: null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $article = KnowledgeArticle::query()->create([
            'workspace_id' => $request->user()->workspace_id,
            ...$this->payload($data, $request),
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('crm.knowledge.index', ['article' => $article->id]);
    }

    public function update(Request $request, KnowledgeArticle $article): RedirectResponse
    {
        $this->assertWorkspace($request, $article);
        $data = $this->validated($request);

        $article->forceFill([
            ...$this->payload($data, $request),
            'updated_by' => $request->user()->id,
        ])->save();

        return redirect()->route('crm.knowledge.index', ['article' => $article->id]);
    }

    public function destroy(Request $request, KnowledgeArticle $article): RedirectResponse
    {
        $this->assertWorkspace($request, $article);
        $article->delete();

        return redirect()->route('crm.knowledge.index');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'category' => ['required', 'string', 'max:80'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['required', 'string', 'max:50000'],
            'tags' => ['nullable', 'string', 'max:500'],
            'status' => ['required', 'in:'.KnowledgeArticle::STATUS_DRAFT.','.KnowledgeArticle::STATUS_PUBLISHED],
        ]);
    }

    /** @param array<string, mixed> $data */
    private function payload(array $data, Request $request): array
    {
        $status = (string) $data['status'];

        return [
            'title' => trim((string) $data['title']),
            'slug' => $this->uniqueSlug($request, trim((string) $data['title']), $request->route('article')),
            'category' => trim((string) $data['category']),
            'excerpt' => filled($data['excerpt'] ?? null) ? trim((string) $data['excerpt']) : null,
            'body' => trim((string) $data['body']),
            'tags' => collect(explode(',', (string) ($data['tags'] ?? '')))
                ->map(fn (string $tag): string => trim($tag))
                ->filter()
                ->unique()
                ->values()
                ->all(),
            'status' => $status,
            'published_at' => $status === KnowledgeArticle::STATUS_PUBLISHED ? now() : null,
        ];
    }

    private function uniqueSlug(Request $request, string $title, mixed $routeArticle): string
    {
        $base = Str::slug($title) ?: 'article';
        $slug = $base;
        $suffix = 2;
        $articleId = $routeArticle instanceof KnowledgeArticle ? $routeArticle->id : null;

        while (KnowledgeArticle::query()
            ->forWorkspace($request->user()->workspace)
            ->where('slug', $slug)
            ->when($articleId, fn ($query) => $query->whereKeyNot($articleId))
            ->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    private function assertWorkspace(Request $request, KnowledgeArticle $article): void
    {
        abort_unless((int) $article->workspace_id === (int) $request->user()->workspace_id, 404);
    }

    /** @return array<string, mixed> */
    private function present(KnowledgeArticle $article): array
    {
        return [
            'id' => $article->id,
            'title' => $article->title,
            'slug' => $article->slug,
            'category' => $article->category,
            'excerpt' => $article->excerpt,
            'body' => $article->body,
            'tags' => $article->tags ?? [],
            'status' => $article->status,
            'published_at' => $article->published_at?->toIso8601String(),
            'updated_at' => $article->updated_at?->toIso8601String(),
            'updated_by' => $article->updatedBy?->name,
        ];
    }
}
