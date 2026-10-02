<?php

it('routes Closer composer chrome through i18n keys', function () {
    $composer = file_get_contents(resource_path('js/components/desk/agents-composer.tsx'));

    expect($composer)
        ->toContain("t('Attach')")
        ->toContain("t('Context')")
        ->toContain("t('Templates')")
        ->toContain("t('Send')")
        ->toContain("t('Send message')")
        ->toContain("t('Your message')")
        ->toContain("t('Message to the agent')")
        ->not->toContain('Message à l’agent')
        ->not->toContain('Votre message')
        ->not->toContain('Envoyer le message');
});
