<?php

namespace App\Enums;

enum EmailVerificationPolicy: string
{
    case Strict = 'strict';
    case AllowCatchAll = 'allow_catch_all';
    case AllowUnknown = 'allow_unknown';
    case AllowUncertain = 'allow_uncertain';

    public function allowsCatchAll(): bool
    {
        return in_array($this, [self::AllowCatchAll, self::AllowUncertain], true);
    }

    public function allowsUnknown(): bool
    {
        return in_array($this, [self::AllowUnknown, self::AllowUncertain], true);
    }
}
