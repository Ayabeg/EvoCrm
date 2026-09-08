<?php

it('freezes the EvoTickets Mobbin contract and plan', function () {
    $contract = file_get_contents(base_path('docs/evotickets-mobbin-contract.md'));
    $plan = file_get_contents(base_path('docs/evotickets-plan.md'));

    expect($contract)->toContain('f9b9fcf1-0767-4ee5-adad-12003a31331e')
        ->and($contract)->toContain('d99d4a6b-9634-4cd3-8ae1-39e337ebd2ea')
        ->and($contract)->toContain('8967ff1d-c744-4825-9f99-7449632e4b6d')
        ->and($contract)->toContain('bf33c8f7-e5a0-48d5-9665-d7d8a8e26509')
        ->and($contract)->toContain('a6d82c16-51a1-4ad7-ba34-f4ebdd3f3aed')
        ->and($contract)->toContain('Unknown Contact')
        ->and($plan)->toContain('contact_id')
        ->and($plan)->toContain('waiting_on_contact')
        ->and($plan)->toContain('Open ticket')
        ->and($plan)->toContain('Knowledge base / articles')
        ->and($plan)->toContain('Deferred');
});
