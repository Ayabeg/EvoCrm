type Playbook = {
    id: number;
    name: string;
    body: string;
};

export default function PlaybookCard({ playbooks }: { playbooks?: Playbook[] | null }) {
    if (!playbooks?.length) {
        return null;
    }

    return (
        <section aria-label="Playbooks" className="space-y-2">
            <h2 className="text-[11px] font-semibold tracking-wide text-mute uppercase">
                Playbooks
            </h2>
            {playbooks.map((playbook) => (
                <div key={playbook.id} className="border-b border-hairline py-2 last:border-b-0">
                    <p className="text-[13px] font-medium text-ink">{playbook.name}</p>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-mute">
                        {playbook.body}
                    </p>
                </div>
            ))}
        </section>
    );
}
