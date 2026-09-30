import { askEvoErrorMessage, askEvoHeaders } from '@/lib/ask-evo';
import type { AskEvoAskResponse, AskEvoPage } from '@/lib/ask-evo';
import type { AgentProfile } from '@/lib/desk/agent-profiles';
import type { AgentRecordContext } from '@/lib/desk/bot-catalog';

const RECORD_CONTEXT_PAGES = new Set<AskEvoPage>([
    'contact',
    'company',
    'deal',
    'quote',
]);

export async function askAgent(
    question: string,
    profile: AgentProfile,
    recordContext: AgentRecordContext | null,
): Promise<AskEvoAskResponse> {
    let page: AskEvoPage = profile.defaultAskPage;
    let effectiveQuestion = question.trim();
    let entityType: string | null = null;
    let entityId: number | null = null;

    if (
        recordContext &&
        RECORD_CONTEXT_PAGES.has(recordContext.type as AskEvoPage)
    ) {
        page = recordContext.type as AskEvoPage;
        entityType = recordContext.type;
        entityId = recordContext.id;
    } else if (recordContext?.type === 'lead') {
        const leadLabel = recordContext.label.slice(0, 32);
        const prefix = `Find lead ${leadLabel}. `;

        page = 'workspace';
        effectiveQuestion = `${prefix}${effectiveQuestion}`.slice(0, 280);
    }

    const response = await fetch('/ask-evo', {
        method: 'POST',
        headers: askEvoHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({
            question: effectiveQuestion,
            page,
            entity_type: entityType,
            entity_id: entityId,
        }),
    });
    const payload = (await response.json()) as AskEvoAskResponse;

    if (!response.ok || !payload.ok) {
        return {
            ...payload,
            ok: false,
            error: payload.error ?? {
                code: 'unavailable',
                message: askEvoErrorMessage(null),
            },
        };
    }

    return payload;
}

export function agentAskError(response: AskEvoAskResponse): string {
    const code = response.error?.code;

    if (code === 'rate_limit') {
        return 'Trop de demandes pour le moment. Réessayez dans une minute.';
    }

    if (code === 'timeout') {
        return 'La demande a pris trop de temps. Réessayez.';
    }

    if (code === 'unauthorized' || code === 'forbidden') {
        return 'Ce contexte CRM n’est pas accessible à votre compte.';
    }

    return (
        response.error?.message ?? 'Le service est momentanément indisponible.'
    );
}
