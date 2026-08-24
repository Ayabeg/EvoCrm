import { type ReactNode, useMemo, useState } from 'react';

type TimelineItem = {
    id: number;
    type: string;
    subject?: string | null;
    body?: string | null;
    done?: boolean;
};

export default function TimelineFilter({
    timeline = [],
    children,
}: {
    timeline?: TimelineItem[];
    children: (items: TimelineItem[]) => ReactNode;
}) {
    const [type, setType] = useState('all');
    const types = useMemo(() => {
        const unique = new Set(timeline.map((item) => item.type).filter(Boolean));

        return ['all', ...Array.from(unique)];
    }, [timeline]);

    const items = type === 'all' ? timeline : timeline.filter((item) => item.type === type);

    return (
        <div>
            <div className="mb-2 flex flex-wrap gap-1">
                {types.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => setType(option)}
                        className={`rounded px-2 py-0.5 text-[10px] uppercase ${type === option ? 'bg-ink text-canvas' : 'bg-canvas-soft text-ink'}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
            {children(items)}
        </div>
    );
}
