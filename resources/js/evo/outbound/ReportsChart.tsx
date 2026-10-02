import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LIGHT_SWATCHES } from '@/evo/tokens/palette';
import { t } from '@/lib/i18n';

function token(name: string): string {
    return LIGHT_SWATCHES.find((swatch) => swatch.token === name)?.hex ?? '';
}

export default function ReportsChart({
    daily,
}: {
    daily: Array<{ day: string; sent: number; opened?: number }>;
}) {
    const ink = token('--evo-ink');
    const teal = token('--evo-teal');
    const hairline = token('--evo-hairline');
    const muted = token('--evo-ink-muted');

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={hairline} vertical={false} />
                <XAxis dataKey="day" stroke={muted} fontSize={11} tickLine={false} />
                <YAxis stroke={muted} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                    contentStyle={{
                        background: 'var(--evo-surface)',
                        border: '1px solid var(--evo-hairline)',
                        borderRadius: 'var(--evo-radius-compact)',
                        fontSize: 12,
                    }}
                />
                <Line type="monotone" dataKey="sent" stroke={ink} strokeWidth={2} dot={false} name={t('Sent')} />
                <Line
                    type="monotone"
                    dataKey="opened"
                    stroke={teal}
                    strokeWidth={2}
                    dot={false}
                    name={t('Opened')}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
