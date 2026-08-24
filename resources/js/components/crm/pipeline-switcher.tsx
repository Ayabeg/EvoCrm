import { router } from '@inertiajs/react';

type PipelineOption = {
    id: number;
    name: string;
    is_default?: boolean;
};

export default function PipelineSwitcher({
    pipelineId,
    pipelines,
    basePath,
}: {
    pipelineId: number;
    pipelines: PipelineOption[];
    basePath: '/crm/deals' | '/crm/deals/board';
}) {
    if (pipelines.length <= 1) {
        return null;
    }

    return (
        <select
            aria-label="Pipeline"
            value={pipelineId}
            onChange={(event) =>
                router.get(
                    basePath,
                    { pipeline: event.target.value },
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
