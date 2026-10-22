<?php

namespace App\Services\Outbound;

class ReplyClassifier
{
    public const INTERESTED = 'interested';

    public const NOT_INTERESTED = 'not_interested';

    public const OUT_OF_OFFICE = 'out_of_office';

    public const UNSUBSCRIBE = 'unsubscribe';

    public const NEEDS_REVIEW = 'needs_review';

    /**
     * Classify only obvious operational signals. Ambiguous language stays in
     * the review queue and never drives an automated response.
     *
     * @return array{label: string, confidence: float}
     */
    public function classify(?string $subject, ?string $body): array
    {
        $text = mb_strtolower(trim(implode("\n", array_filter([$subject, $body]))));

        if ($this->matches($text, ['unsubscribe', 'opt out', 'opt-out', 'remove me', 'do not contact', 'stop emailing', 'stop contacting', 'désabonner', 'ne me contactez plus'])) {
            return ['label' => self::UNSUBSCRIBE, 'confidence' => 0.99];
        }

        if ($this->matches($text, ['out of office', 'automatic reply', 'auto-reply', 'autoreply', 'on vacation', 'en congé'])) {
            return ['label' => self::OUT_OF_OFFICE, 'confidence' => 0.97];
        }

        if ($this->matches($text, ['not interested', 'no thanks', 'no thank you', 'pas intéressé', 'pas interesse'])) {
            return ['label' => self::NOT_INTERESTED, 'confidence' => 0.94];
        }

        if ($this->matches($text, ['interested', 'learn more', 'book a demo', 'schedule a demo', 'schedule a call', 'let us talk', 'call me', 'intéressé', 'interesse'])) {
            return ['label' => self::INTERESTED, 'confidence' => 0.82];
        }

        return ['label' => self::NEEDS_REVIEW, 'confidence' => 0.0];
    }

    /**
     * @param  list<string>  $needles
     */
    private function matches(string $text, array $needles): bool
    {
        foreach ($needles as $needle) {
            if (str_contains($text, $needle)) {
                return true;
            }
        }

        return false;
    }
}
