<?php

namespace App\Services\Ai;

enum AskEvoContextKind: string
{
    case Workspace = 'workspace';
    case Contact = 'contact';
    case Company = 'company';
    case Deal = 'deal';
    case Quote = 'quote';
    case InboxConversation = 'inbox_conversation';
    case Activity = 'activity';
    case Automation = 'automation';
    case Dashboard = 'dashboard';
    case Activation = 'activation';

    public function requiresEntityId(): bool
    {
        return match ($this) {
            self::Workspace, self::Dashboard, self::Activation => false,
            default => true,
        };
    }

    public function isSupportedRecord(): bool
    {
        return in_array($this, [
            self::Contact,
            self::Company,
            self::Deal,
            self::Quote,
        ], true);
    }
}
