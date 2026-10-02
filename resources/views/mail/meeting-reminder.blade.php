<p>{{ __('Hi :name,', ['name' => $guestName]) }}</p>

<p>{{ __('Reminder: your meeting with :host is coming up.', ['host' => $hostName]) }}</p>

<p>
    <strong>{{ $whenLabel }}</strong><br>
    {{ __('Timezone: :tz', ['tz' => $timezone]) }}
    @if ($locationNote)
        <br>{{ $locationNote }}
    @endif
</p>

@if ($note)
    <p>{{ __('Your note: :note', ['note' => $note]) }}</p>
@endif

<p>— EvoSales · Evotechly</p>
