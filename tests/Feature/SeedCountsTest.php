<?php

use App\Models\AdCampaign;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Mailbox;
use App\Models\Sequence;
use App\Models\Thread;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Artisan;

it('seeds a week of Algeria-first sales-OS data', function () {
    Artisan::call('db:seed', ['--class' => DatabaseSeeder::class, '--no-interaction' => true]);

    expect(User::query()->where('email', 'owner@evosales.local')->exists())->toBeTrue()
        ->and(Company::query()->count())->toBeGreaterThanOrEqual(10)
        ->and(Contact::query()->count())->toBeGreaterThanOrEqual(20)
        ->and(Deal::query()->count())->toBeGreaterThanOrEqual(12)
        ->and(Thread::query()->count())->toBeGreaterThanOrEqual(6)
        ->and(Sequence::query()->count())->toBeGreaterThanOrEqual(3)
        ->and(Sequence::query()->where('channel', 'whatsapp_cloud')->exists())->toBeTrue()
        ->and(Mailbox::query()->where('enabled', false)->exists())->toBeTrue()
        ->and(AdCampaign::query()->where('click_to_whatsapp', true)->exists())->toBeTrue()
        ->and(AdCampaign::query()->where('lead_form', true)->exists())->toBeTrue();

    $stages = Deal::query()->with('stage')->get()->pluck('stage.slug')->unique()->sort()->values();
    expect($stages->intersect(['new', 'qualified', 'demo', 'proposal', 'won', 'lost'])->count())->toBe(6);
});
