import {
    applyPipeline,
    emptyCanonicalListQuery,
    fromActiveFilters,
    visitListQuery,
} from '@/lib/list-query';
import type { ActiveFilterBag, ListQueryExtraInput } from '@/lib/list-query/serialize';

type PipelineOption = {
    id: number;
    name: string;
    is_default?: boolean;
};

export default function PipelineSwitcher({
    pipelineId,
    pipelines,
    basePath,
    activeFilters,
    extraQuery,
}: {
    pipelineId: number;
    pipelines: PipelineOption[];
    basePath: '/crm/deals' | '/crm/deals/board';
    activeFilters?: ActiveFilterBag;
    extraQuery?: ListQueryExtraInput;
}) {
    if (pipelines.length <= 1) {
        return null;
    }

    const extras = extraQuery ?? { pipeline: pipelineId };
    const isBoard = basePath === '/crm/deals/board';
    const current = isBoard
        ? {
              ...emptyCanonicalListQuery(),
              view: null,
              extras: {
                  pipeline:
                      extras.pipeline === null || extras.pipeline === undefined || extras.pipeline === ''
                          ? pipelineId
                          : Number(extras.pipeline),
              },
          }
        : fromActiveFilters(activeFilters ?? {}, extras);

    return (
        <select
            aria-label="Pipeline"
            value={pipelineId}
            onChange={(event) =>
                visitListQuery(
                    basePath,
                    applyPipeline(current, Number(event.target.value)),
                    'deal',
                    { preserveState: true, preserveScroll: true },
                )
            }
            className="h-8 rounded border border-hairline bg-canvas px-2 text-[12px]"
            data-testid="pipeline-picker"
        >
            {pipelines.map((option) => (
                <option key={option.id} value={option.id}>
                    {option.name}
                    {option.is_default ? ' (default)' : ''}
                </option>
            ))}
        </select>
    );
}
