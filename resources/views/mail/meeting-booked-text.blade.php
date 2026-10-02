{{ __('Hi :name,', ['name' => $guestName]) }}

{{ __(':host confirmed your meeting.', ['host' => $hostName]) }}

{{ $whenLabel }}
{{ __('Timezone: :tz', ['tz' => $timezone]) }}
@if ($locationNote)
{{ $locationNote }}
@endif

@if ($note)
{{ __('Your note: :note', ['note' => $note]) }}
@endif

— EvoSales · Evotechly
