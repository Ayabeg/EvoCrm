Hi {{ $guestName }},

Reminder: your meeting with {{ $hostName }} is coming up.

{{ $whenLabel }}
Timezone: {{ $timezone }}
@if ($locationNote)
{{ $locationNote }}
@endif

@if ($note)
Your note: {{ $note }}
@endif

— EvoSales · Evotechly
