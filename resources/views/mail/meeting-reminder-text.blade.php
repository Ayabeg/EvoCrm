{{ __('Hi :name,', ['name' => $guestName]) }}

{{ __('Reminder: your meeting with :host is coming up.', ['host' => $hostName]) }}

{{ $whenLabel }}
{{ __('Timezone: :tz', ['tz' => $timezone]) }}
@if ($locationNote)
{{ $locationNote }}
@endif

@if ($note)
{{ __('Your note: :note', ['note' => $note]) }}
@endif

— EvoSales · Evotechly
