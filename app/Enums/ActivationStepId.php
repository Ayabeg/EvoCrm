<?php

namespace App\Enums;

enum ActivationStepId: string
{
    case AddCrmData = 'add_crm_data';
    case ConfigurePipeline = 'configure_pipeline';
    case FirstDeal = 'first_deal';
    case FirstActivity = 'first_activity';
    case ConnectIntegration = 'connect_integration';

    public function isCore(): bool
    {
        return match ($this) {
            self::AddCrmData, self::FirstDeal, self::FirstActivity => true,
            self::ConfigurePipeline, self::ConnectIntegration => false,
        };
    }
}
