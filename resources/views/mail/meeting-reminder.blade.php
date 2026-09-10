<p>Hi {{ $guestName }},</p>

<p>Reminder: your meeting with {{ $hostName }} is coming up.</p>

<p>
    <strong>{{ $whenLabel }}</strong><br>
    Timezone: {{ $timezone }}
    @if ($locationNote)
        <br>{{ $locationNote }}
    @endif
</p>

@if ($note)
    <p>Your note: {{ $note }}</p>
@endif

<p>— EvoSales · Evotechly</p>
