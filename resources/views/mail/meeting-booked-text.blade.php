Hi {{ $guestName }},

{{ $hostName }} confirmed your meeting.

{{ $whenLabel }}
Timezone: {{ $timezone }}
@if ($locationNote)
{{ $locationNote }}
@endif

@if ($note)
Your note: {{ $note }}
@endif

— EvoSales · Evotechly
