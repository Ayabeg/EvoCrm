<?php

use Illuminate\Support\Facades\File;

it('locks P26 keyboard, names, and overlay a11y without a new widget kit', function () {
    $a11y = File::get(resource_path('js/lib/a11y.ts'));
    $kanban = File::get(resource_path('js/components/crm/pipeline-kanban.tsx'));
    $list = File::get(resource_path('js/components/crm/list-view-table.tsx'));
    $table = File::get(resource_path('js/ds/workspace/DataTable.tsx'));
    $bulk = File::get(resource_path('js/ds/workspace/BulkActionBar.tsx'));
    $inbox = File::get(resource_path('js/components/crm/inbox-chrome.tsx'));
    $askPanel = File::get(resource_path('js/components/crm/ask-evo-panel.tsx'));
    $askDrawer = File::get(resource_path('js/components/crm/ask-evo-drawer.tsx'));
    $activation = File::get(resource_path('js/components/dashboard/activation-checklist.tsx'));
    $filters = File::get(resource_path('js/ds/workspace/FilterBar.tsx'));
    $views = File::get(resource_path('js/ds/workspace/SavedViews.tsx'));
    $dialog = File::get(resource_path('js/evo/ui/dialog.tsx'));
    $sheet = File::get(resource_path('js/evo/ui/sheet.tsx'));
    $palette = File::get(resource_path('js/evo/patterns/command-palette/index.tsx'));
    $motion = File::get(resource_path('css/aurora-motion.css'));
    $leads = File::get(resource_path('js/pages/leads/board.tsx'));
    $advanced = File::get(resource_path('js/ds/workspace/AdvancedFilterDrawer.tsx'));
    $js = File::get(base_path('tests/js/p26-accessibility.ts'));
    $app = File::get(resource_path('css/app.css'));

    expect($a11y)->toContain('export function isActivationKey')
        ->and($a11y)->toContain('export function unreadCountLabel')
        ->and($a11y)->toContain('export function conversationA11yName')
        ->and($a11y)->toContain('export function trapTabKey')
        ->and($a11y)->toContain('export function restoreFocus')
        ->and($a11y)->not->toContain('axe-core')
        ->and($a11y)->not->toContain('jest-axe');

    expect($kanban)->toContain('aria-busy={busy || undefined}')
        ->and($kanban)->toContain('aria-label="Pipeline board"')
        ->and($kanban)->toContain("event.key !== 'Enter' && event.key !== ' '")
        ->and($kanban)->not->toContain('aria-hidden={busy')
        ->and($kanban)->toContain('tabIndex={0}')
        ->and($kanban)->toContain('motion-reduce:transition-none');

    expect($list)->toContain("event.key !== 'Enter'")
        ->and($list)->toContain("event.key !== ' '")
        ->and($list)->toContain('focus-visible:outline-[color:var(--color-focus-ring)]')
        ->and($list)->toContain('aria-label={`Select ${row.id}`}');

    expect($table)->toContain('aria-label="Select page"')
        ->and($table)->toContain('aria-selected={onToggle ? selected : undefined}');

    expect($bulk)->toContain('aria-live="polite"')
        ->and($bulk)->toContain('aria-label="Bulk action"')
        ->and($bulk)->toContain('aria-label="Owner"')
        ->and($bulk)->toContain('aria-label="Sequence"')
        ->and($bulk)->toContain('aria-label="Stage"');

    expect($inbox)->toContain('conversationA11yName')
        ->and($inbox)->toContain("aria-current={active ? 'true' : undefined}")
        ->and($inbox)->toContain('aria-label={conversationA11yName')
        ->and($inbox)->toContain('<span className="sr-only"> unread</span>')
        ->and($inbox)->toContain("aria-pressed={mode === 'reply'}")
        ->and($inbox)->toContain("aria-pressed={mode === 'note'}")
        ->and($inbox)->toContain('aria-label={')
        ->and($inbox)->toContain("t('Type your message')")
        ->and($inbox)->toContain("t('Private note')")
        ->and($inbox)->not->toContain('InboxV2');

    expect($askPanel)->toContain('role="group"')
        ->and($askPanel)->toContain('aria-label="Suggested questions"')
        ->and($askPanel)->toContain('DrawerDescription')
        ->and($askPanel)->toContain('aria-label="Ask Evo question"')
        ->and($askPanel)->not->toContain('role="listitem"');

    expect($askDrawer)->toContain('role="group"')
        ->and($askDrawer)->toContain('DrawerDescription')
        ->and($askDrawer)->toContain('openerRef.current?.focus()')
        ->and($askDrawer)->not->toContain('role="listitem"');

    expect($activation)->toContain('role="progressbar"')
        ->and($activation)->toContain("aria-current={current ? 'step' : undefined}")
        ->and($activation)->toContain('motion-reduce:transition-none')
        ->and($activation)->toContain("t('Done')");

    expect($filters)->toContain("aria-label={t('Clear :label'")
        ->and($filters)->toContain('aria-hidden');

    expect($views)->toContain("aria-current={active ? 'page' : undefined}")
        ->and($views)->toContain("aria-current={String(view.id) === activeViewId ? 'page' : undefined}");

    expect($dialog)->toContain('motion-reduce:animate-none')
        ->and($dialog)->toContain('sr.close')
        ->and($sheet)->toContain('motion-reduce:animate-none')
        ->and($sheet)->toContain('sr.close');
    expect(file_get_contents(resource_path('js/evo/lib/a11y.ts')))->toContain("close: 'Fermer'");

    expect($palette)->toContain('trapTabKey')
        ->and($palette)->toContain('restoreFocus')
        ->and($palette)->toContain('data-a11y="focus-trap"')
        ->and($palette)->toContain('data-command="backdrop"')
        ->and($palette)->toContain('aria-label="Palette de commandes"')
        ->and($palette)->toContain('aria-label="Rechercher des commandes"');

    expect($motion)->toContain("@media (prefers-reduced-motion: reduce)")
        ->and($motion)->toContain("[data-command='os']")
        ->and($motion)->toContain("[data-command='backdrop']");

    expect($leads)->toContain('group-focus-within:opacity-100')
        ->and($leads)->toContain('aria-label={`Move ${deal.title}`}');

    expect($advanced)->toContain('DrawerDescription');

    expect($js)->toContain('unread is named, not color-only')
        ->and($js)->toContain('selection is named, not wash-only')
        ->and($js)->toContain('Space activates a focusable widget');

    expect($app)->toContain('--color-text-muted: var(--evo-ink-muted)')
        ->and($app)->toContain('--color-focus-ring: var(--evo-focus)');
});

it('does not claim WCAG certification or start P27 motion tokens', function () {
    $audit = File::get(base_path('docs/accessibility/P26-AUDIT.md'));
    $contract = File::get(base_path('docs/accessibility/P26-CONTRACT.md'));
    $handoff = File::get(base_path('docs/accessibility/P26-P27-HANDOFF.md'));
    $motion = File::get(resource_path('css/aurora-motion.css'));

    expect($audit)->toContain('Not a certification claim')
        ->and($audit)->toContain('BLOCKER')
        ->and($audit)->toContain('DEFER-VISUAL')
        ->and($contract)->toContain('MERGE READY: NO')
        ->and($contract)->toContain('READY_FOR_CONTABO')
        ->and($handoff)->toContain('P27 is **not started**')
        ->and($motion)->not->toContain('--motion-bounce')
        ->and($motion)->not->toContain('lottie');
});
