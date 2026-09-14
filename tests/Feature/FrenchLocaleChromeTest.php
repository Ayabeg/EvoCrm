<?php

use App\Models\MeetingSchedule;
use App\Models\User;
use Illuminate\Support\Facades\App;

it('resolves day-1 chrome keys to French', function () {
    App::setLocale('fr');

    expect(__('Log in'))->toBe('Connexion')
        ->and(__('Home'))->toBe('Accueil')
        ->and(__('Contacts'))->toBe('Contacts')
        ->and(__('Deals'))->toBe('Affaires')
        ->and(__('Quotes'))->toBe('Devis')
        ->and(__('Inbox'))->toBe('Boîte de réception')
        ->and(__('Meetings'))->toBe('Réunions')
        ->and(__('Create contact'))->toBe('Créer un contact')
        ->and(__('Search EvoCRM…'))->toBe('Rechercher EvoCRM…')
        ->and(__('Book a meeting'))->toBe('Réserver une réunion')
        ->and(__('Accept quote'))->toBe('Accepter le devis')
        ->and(__('That booking link is already taken.'))->toBe('Ce lien de réservation est déjà pris.')
        ->and(__('Enter an Algerian mobile (+213).'))->toBe('Saisissez un mobile algérien (+213).');
});

it('shares French translations on login when locale is fr', function () {
    App::setLocale('fr');

    $this->get(route('login'))
        ->assertOk()
        ->assertSee('lang="fr"', false)
        ->assertInertia(fn ($page) => $page
            ->component('auth/login')
            ->where('locale', 'fr')
            ->where('translations.Log in', 'Connexion')
            ->where('translations.Home', 'Accueil')
            ->where('translations.Search EvoCRM…', 'Rechercher EvoCRM…'));
});

it('serves French chrome on home and public book when locale is fr', function () {
    App::setLocale('fr');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->where('locale', 'fr')
            ->where('translations.Home', 'Accueil')
            ->where('translations.Contacts', 'Contacts')
            ->where('translations.Deals', 'Affaires')
            ->where('translations.Quotes', 'Devis'));

    $schedule = MeetingSchedule::forUser($user);

    $this->get('/book/'.$schedule->slug)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/book')
            ->where('locale', 'fr')
            ->where('translations.Book a meeting', 'Réserver une réunion')
            ->where('translations.Confirm meeting', 'Confirmer la réunion'));
});

it('keeps English keys as the fallback when locale is en', function () {
    App::setLocale('en');

    expect(__('Log in'))->toBe('Log in')
        ->and(__('A key that does not exist'))->toBe('A key that does not exist');

    $this->get(route('login'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('locale', 'en')
            ->where('translations', []));
});
