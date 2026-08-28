export default function PageHeader({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <h1 className="text-page-title font-semibold tracking-tight">
                    {title}
                </h1>
                {description ? (
                    <p className="mt-0.5 text-[11px] leading-4 text-mute">
                        {description}
                    </p>
                ) : null}
            </div>
            {children}
        </div>
    );
}
