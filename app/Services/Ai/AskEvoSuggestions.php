<?php

namespace App\Services\Ai;

/**
 * Deterministic chips from context kind + capabilities. Never invent insights.
 */
final class AskEvoSuggestions
{
    /**
     * @param  list<string>  $capabilities
     * @return list<array{id: string, label: string, question: string}>
     */
    public function for(AskEvoContextKind $kind, array $capabilities = []): array
    {
        $chips = match ($kind) {
            AskEvoContextKind::Contact => [
                ['id' => 'contact-who', 'label' => 'Who is this?', 'question' => 'Who is this contact?'],
                ['id' => 'contact-activity', 'label' => 'Last activity', 'question' => 'What is the last activity on this contact?'],
                ['id' => 'contact-deals', 'label' => 'Open deals', 'question' => 'What open deals are on this contact?'],
            ],
            AskEvoContextKind::Company => [
                ['id' => 'company-who', 'label' => 'Company facts', 'question' => 'What do we know about this company?'],
                ['id' => 'company-domain', 'label' => 'Domain', 'question' => 'What is the domain on this company?'],
            ],
            AskEvoContextKind::Deal => [
                ['id' => 'deal-stage', 'label' => 'Stage and amount', 'question' => 'What is the stage and amount?'],
                ['id' => 'deal-next', 'label' => 'Next step', 'question' => 'What is the next step on this deal?'],
            ],
            AskEvoContextKind::Quote => [
                ['id' => 'quote-total', 'label' => 'Total and status', 'question' => 'What is the quote total and status?'],
                ['id' => 'quote-sent', 'label' => 'Sent or accepted', 'question' => 'Has this quote been sent or accepted?'],
            ],
            AskEvoContextKind::InboxConversation => [
                ['id' => 'inbox-summary', 'label' => 'Summarize thread', 'question' => 'Summarize the recent messages in this conversation.'],
            ],
            AskEvoContextKind::Activity => [
                ['id' => 'activity-what', 'label' => 'What is this?', 'question' => 'What is this activity and when is it due?'],
            ],
            AskEvoContextKind::Automation => [
                ['id' => 'auto-what', 'label' => 'What does it do?', 'question' => 'What does this workflow do?'],
                ['id' => 'auto-history', 'label' => 'Last runs', 'question' => 'What happened on the latest runs?'],
            ],
            AskEvoContextKind::Dashboard => [
                ['id' => 'dash-attention', 'label' => 'Needs attention', 'question' => 'What needs attention on Home?'],
                ['id' => 'dash-work', 'label' => 'Today’s work', 'question' => 'What is on the activity work queue?'],
            ],
            AskEvoContextKind::Activation => [
                ['id' => 'act-left', 'label' => 'What’s left', 'question' => 'What activation steps are still open?'],
            ],
            AskEvoContextKind::Workspace => [
                ['id' => 'ws-find', 'label' => 'Find a record', 'question' => 'Search my workspace for a contact or deal.'],
            ],
        };

        if (! in_array('crm.view', $capabilities, true) && $capabilities !== []) {
            return array_values(array_filter(
                $chips,
                fn (array $chip): bool => ! str_contains($chip['id'], 'deal') && ! str_contains($chip['id'], 'contact'),
            ));
        }

        return $chips;
    }
}
