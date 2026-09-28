import { Paperclip, PaperPlaneRight, X } from '@phosphor-icons/react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useState } from 'react';
import { BotPicker } from '@/components/desk/bot-picker';
import type {
    BotDefinition,
    ConnectorDefinition,
} from '@/lib/desk/bot-catalog';
import { cn } from '@/lib/utils';

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8530E]';

type AgentsComposerProps = {
    selectedBot: BotDefinition;
    selectedConnectorIds: string[];
    onSelectBot: (bot: BotDefinition) => void;
    onAttachConnector: (connector: ConnectorDefinition) => void;
    onRemoveConnector: (connectorId: string) => void;
    onCreateBot: () => void;
    onSend: (prompt: string) => void;
};

export function AgentsComposer({
    selectedBot,
    selectedConnectorIds,
    onSelectBot,
    onAttachConnector,
    onRemoveConnector,
    onCreateBot,
    onSend,
}: AgentsComposerProps) {
    const [draft, setDraft] = useState('');
    const canSend = draft.trim().length > 0;

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!canSend) {
            return;
        }

        onSend(draft.trim());
        setDraft('');
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
        ) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
        }
    }

    return (
        <form
            className="rounded-xl border border-black/10 bg-white p-2 shadow-[0_10px_24px_rgba(13,27,36,0.06)]"
            aria-label="Command composer"
            data-agents-composer
            onSubmit={submit}
        >
            <div className="flex flex-wrap items-center gap-1.5 px-1 pb-2">
                <BotPicker
                    selectedBot={selectedBot}
                    selectedConnectorIds={selectedConnectorIds}
                    onSelectBot={onSelectBot}
                    onAttachConnector={onAttachConnector}
                    onCreateBot={onCreateBot}
                />
                {selectedConnectorIds.map((connectorId) => (
                    <span
                        key={connectorId}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-[#0F4C5C]/15 bg-[#0F4C5C]/[0.06] px-2 text-[11px] font-medium text-[#0F4C5C]"
                    >
                        <Paperclip className="size-3" weight="regular" />
                        {connectorId}
                        <button
                            type="button"
                            className={cn(
                                'ml-0.5 grid size-4 place-items-center rounded-sm text-[#0F4C5C]/65 hover:bg-[#0F4C5C]/10 hover:text-[#0F4C5C]',
                                focusRing,
                            )}
                            aria-label={`Remove ${connectorId} connector`}
                            onClick={() => onRemoveConnector(connectorId)}
                        >
                            <X className="size-3" weight="bold" />
                        </button>
                    </span>
                ))}
            </div>

            <div className="flex items-end gap-2 rounded-lg border border-black/8 bg-[#F7F8F5] p-2">
                <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        'min-h-[54px] flex-1 resize-none border-0 bg-transparent px-1 py-1 text-[13px] leading-5 text-[#0D1B24] outline-none placeholder:text-[#0D1B24]/42',
                        focusRing,
                    )}
                    placeholder="Ask about a deal, a lead, or a WhatsApp thread"
                    aria-label="Ask your bot"
                    rows={2}
                />
                <button
                    type="submit"
                    disabled={!canSend}
                    className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-md transition-colors disabled:cursor-not-allowed',
                        canSend
                            ? 'bg-[#E8530E] text-white hover:bg-[#C9480B]'
                            : 'bg-[#E3E6E3] text-[#0D1B24]/38',
                        focusRing,
                    )}
                    aria-label="Send"
                >
                    <PaperPlaneRight className="size-4" weight="fill" />
                </button>
            </div>
            <div className="flex items-center justify-between px-1 pt-2 text-[10px] text-[#0D1B24]/45">
                <span>Enter to send · Shift + Enter for a new line</span>
                <span>{selectedBot.job}</span>
            </div>
        </form>
    );
}
