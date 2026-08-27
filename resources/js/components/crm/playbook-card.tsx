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
        <section aria-label="Playbooks" className="space-y-3">
            <h2 className="text-[13px] font-semibold">Playbooks</h2>
            {playbooks.map((playbook) => (
                <div key={playbook.id} className="rounded-xl border border-hairline bg-canvas p-3">
                    <p className="text-[13px] font-medium text-ink">{playbook.name}</p>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                        {playbook.body}
                    </p>
                </div>
            ))}
        </section>
    );
}
