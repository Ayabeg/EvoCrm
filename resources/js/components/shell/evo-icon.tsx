import type { Icon } from '@phosphor-icons/react';
import {
    AddressBook,
    Buildings,
    ChartLine,
    CheckSquare,
    FileText,
    FlowArrow,
    GearSix,
    Handshake,
    House,
    Megaphone,
    PaperPlaneTilt,
    Path,
    SquaresFour,
    Tray,
} from '@phosphor-icons/react';

/**
 * Product icon registry. The brandbook in docs/brandbook has tokens and logo
 * rules, not an icon set. Phosphor is the temporary product family.
 */
const ICONS = {
    home: House,
    contacts: AddressBook,
    companies: Buildings,
    leads: Path,
    deals: Handshake,
    pipeline: SquaresFour,
    messages: Tray,
    tasks: CheckSquare,
    quotes: FileText,
    automation: FlowArrow,
    ads: Megaphone,
    reports: ChartLine,
    outbound: PaperPlaneTilt,
    settings: GearSix,
} as const satisfies Record<string, Icon>;

export type EvoIconName = keyof typeof ICONS;

export function EvoIcon({
    name,
    className,
    active = false,
}: {
    name: EvoIconName;
    className?: string;
    active?: boolean;
}) {
    const Icon = ICONS[name];

    return <Icon className={className} weight={active ? 'fill' : 'regular'} aria-hidden />;
}
