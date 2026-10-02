{{ __('You\'re invited, :name', ['name' => $inviteeName]) }}

{{ __(':inviter added you to the :workspace workspace on EvoSales — Evotechly\'s sales OS.', ['inviter' => $inviterName, 'workspace' => $workspaceName]) }}

{{ __('Set your password to activate your login (first-login link, single use):') }}
{{ $inviteUrl }}

{{ __('We never email you a password. If you weren\'t expecting this invite, you can ignore this email.') }}

— EvoSales · Evotechly
