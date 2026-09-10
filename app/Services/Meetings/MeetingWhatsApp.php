<?php

namespace App\Services\Meetings;

use App\Models\Contact;
use App\Models\Integration;
use App\Models\Workspace;
use App\Services\Evolution\EvolutionCloudService;

class MeetingWhatsApp
{
    public const TEMPLATE_BOOKED = 'meeting_booked';

    public const TEMPLATE_REMINDER = 'meeting_reminder';

    public const TEMPLATE_QUOTE = 'quote_accepted';

    public function __construct(private EvolutionCloudService $evolution) {}

    /**
     * Cloud template first, then phone text. Null means no connected channel.
     *
     * @param  list<string>  $bodyParams
     * @return 'sent'|'failed'|null
     */
    public function send(
        Workspace $workspace,
        ?Contact $contact,
        string $phone,
        string $template,
        string $text,
        array $bodyParams,
    ): ?string {
        if (! $this->evolution->configured()) {
            return null;
        }

        $number = $contact?->phone_e164 ?: $phone;

        if (! filled($number)) {
            return null;
        }

        $cloud = $workspace->integration(Integration::PROVIDER_WHATSAPP_BUSINESS);
        $session = $workspace->integration(Integration::PROVIDER_WHATSAPP);
        $cloudAttempted = false;

        if ($cloud?->isConnected()) {
            $instance = $cloud->meta['instance']
                ?? $this->evolution->instanceName($workspace, EvolutionCloudService::KIND_WHATSAPP_BUSINESS);
            $name = $workspace->meetingTemplateName($template);

            if ($name !== '') {
                $cloudAttempted = true;
                $result = $this->evolution->sendTemplate(
                    $number,
                    $name,
                    $workspace->meetingTemplateLanguage(),
                    [
                        [
                            'type' => 'body',
                            'parameters' => array_map(
                                fn (string $value) => ['type' => 'text', 'text' => $value],
                                $bodyParams,
                            ),
                        ],
                    ],
                    $instance,
                );

                if ($result['ok']) {
                    return 'sent';
                }
            }
        }

        if ($session?->isConnected()) {
            $instance = $session->meta['instance']
                ?? $this->evolution->instanceName($workspace, EvolutionCloudService::KIND_WHATSAPP);
            $textResult = $this->evolution->sendText($number, $text, $instance);

            return $textResult['ok'] ? 'sent' : 'failed';
        }

        return $cloudAttempted ? 'failed' : null;
    }
}
