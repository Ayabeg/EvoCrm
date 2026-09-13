<?php

namespace App\Console\Commands;

use App\Http\Middleware\EnforceSimpleMode;
use App\Policies\ActivityPolicy;
use App\Policies\CompanyPolicy;
use App\Policies\ContactPolicy;
use App\Policies\DealPolicy;
use App\Policies\LeadPolicy;
use App\Policies\QuotePolicy;
use App\Services\Crm\QuoteAcceptor;
use App\Support\SimpleMode;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;

class ProductReadyCommand extends Command
{
    /**
     * Critical Pest files this gate requires on disk. Existence only — this
     * command does not run the suite.
     *
     * @var list<string>
     */
    public const CRITICAL_PEST = [
        'tests/Feature/CreateContactTest.php',
        'tests/Feature/CrmCreateDrawerTest.php',
        'tests/Feature/LeadConversionTest.php',
        'tests/Feature/MoveDealTest.php',
        'tests/Feature/ActivityCreateTest.php',
        'tests/Feature/QuoteAcceptanceTest.php',
        'tests/Feature/QuietHoursTest.php',
        'tests/Feature/OutboundBounceTest.php',
        'tests/Feature/OutboundReplyPauseTest.php',
        'tests/Feature/InboxCspHeadersTest.php',
        'tests/Feature/AdsHubTest.php',
        'tests/Feature/MeetingSchedulerTest.php',
        'tests/Feature/Auth/GoogleAuthenticationTest.php',
        'tests/Feature/MetaIntegrationTest.php',
        'tests/Feature/CrmPolicyTest.php',
        'tests/Feature/CrmPermissionsTest.php',
        'tests/Feature/SimpleModeGuardTest.php',
        'tests/Feature/SimpleModeToggleTest.php',
        'tests/Feature/BaileysPathTest.php',
        'tests/Feature/Api/V1/SanctumTokenTest.php',
    ];

    /**
     * G4 workspace policies (#180).
     *
     * @var list<class-string>
     */
    public const G4_POLICIES = [
        ContactPolicy::class,
        CompanyPolicy::class,
        LeadPolicy::class,
        DealPolicy::class,
        QuotePolicy::class,
        ActivityPolicy::class,
    ];

    protected $signature = 'evocrm:product-ready';

    protected $description = 'G6 stop gate: existence checks for product-ready (does not run Pest)';

    protected $help = <<<'HELP'
Exits 0 only when the G6 product-ready existence checks pass.

Does not run the Pest suite (too slow). Critical tests that must exist on disk:

  tests/Feature/CreateContactTest.php
  tests/Feature/CrmCreateDrawerTest.php
  tests/Feature/LeadConversionTest.php
  tests/Feature/MoveDealTest.php
  tests/Feature/ActivityCreateTest.php
  tests/Feature/QuoteAcceptanceTest.php
  tests/Feature/QuietHoursTest.php
  tests/Feature/OutboundBounceTest.php
  tests/Feature/OutboundReplyPauseTest.php
  tests/Feature/InboxCspHeadersTest.php
  tests/Feature/AdsHubTest.php
  tests/Feature/MeetingSchedulerTest.php
  tests/Feature/Auth/GoogleAuthenticationTest.php
  tests/Feature/MetaIntegrationTest.php
  tests/Feature/CrmPolicyTest.php
  tests/Feature/CrmPermissionsTest.php
  tests/Feature/SimpleModeGuardTest.php
  tests/Feature/SimpleModeToggleTest.php
  tests/Feature/BaileysPathTest.php
  tests/Feature/Api/V1/SanctumTokenTest.php

Also requires: QuoteAcceptor, the six G4 policies, workspace simple_mode
(#181 SimpleMode / EnforceSimpleMode), and Sanctum /api/v1 (`routes/api.php`
plus laravel/sanctum). ProductionSafetyValidator is checked and warned if
missing — this command does not invent a safety stack.

See docs/architecture/EVOCRM_PRODUCT_READY.md.
HELP;

    public function handle(): int
    {
        $failed = false;

        if ($this->productionSafetyClass()) {
            $this->info('ProductionSafetyValidator (or equivalent) present.');
        } else {
            $this->warn('ProductionSafetyValidator is not on this branch — not inventing a safety stack.');
        }

        foreach (self::CRITICAL_PEST as $relative) {
            if (! is_file(base_path($relative))) {
                $this->error("Missing critical Pest file: {$relative}");
                $failed = true;
            }
        }

        if (! class_exists(QuoteAcceptor::class)) {
            $this->error('Public quote accept requires App\\Services\\Crm\\QuoteAcceptor.');
            $failed = true;
        } else {
            $this->info('QuoteAcceptor present.');
        }

        foreach (self::G4_POLICIES as $policy) {
            if (! class_exists($policy)) {
                $this->error("Missing G4 policy: {$policy}");
                $failed = true;
            }
        }

        if (! $this->simpleModePresent()) {
            $this->error('Workspace simple_mode / SimpleMode middleware from #181 is missing.');
            $failed = true;
        } else {
            $this->info('Simple mode (#181) present.');
        }

        if (! $this->sanctumApiPresent()) {
            $this->error('Sanctum /api/v1 is missing (routes/api.php or laravel/sanctum).');
            $failed = true;
        } else {
            $this->info('Sanctum /api/v1 present.');
        }

        if ($failed) {
            $this->error('evocrm:product-ready failed.');

            return self::FAILURE;
        }

        $this->info('evocrm:product-ready — product-ready checks passed.');

        return self::SUCCESS;
    }

    private function productionSafetyClass(): ?string
    {
        foreach ([
            'App\\Support\\ProductionSafetyValidator',
            'App\\Services\\Operations\\ProductionSafetyValidator',
            'App\\Services\\Safety\\ProductionSafetyValidator',
        ] as $class) {
            if (class_exists($class)) {
                return $class;
            }
        }

        return null;
    }

    private function simpleModePresent(): bool
    {
        $middleware = class_exists(SimpleMode::class) || class_exists(EnforceSimpleMode::class);
        $migration = collect(glob(database_path('migrations/*simple_mode*workspaces*.php')))->isNotEmpty();
        $column = Schema::hasTable('workspaces') && Schema::hasColumn('workspaces', 'simple_mode');

        return $middleware && ($migration || $column);
    }

    private function sanctumApiPresent(): bool
    {
        if (! is_file(base_path('routes/api.php'))) {
            return false;
        }

        if (class_exists(Sanctum::class)) {
            return true;
        }

        $composer = file_get_contents(base_path('composer.json'));

        return is_string($composer) && str_contains($composer, '"laravel/sanctum"');
    }
}
