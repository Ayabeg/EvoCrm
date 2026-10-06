<?php

use App\Mail\MeetingBookedMail;
use App\Mail\WorkspaceInviteMail;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Meetings\MeetingMailer;
use App\Services\People\WorkspaceInviteMailer;
use App\Support\Locale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

function localeJson(string $locale): array
{
    $decoded = json_decode((string) file_get_contents(lang_path($locale.'.json')), true);

    expect($decoded)->toBeArray();

    return $decoded;
}

it('keeps identical translation keys across fr, en, and ar', function () {
    $fr = localeJson('fr');
    $en = localeJson('en');
    $ar = localeJson('ar');

    expect(array_keys($fr))
        ->toEqual(array_keys($en))
        ->toEqual(array_keys($ar))
        ->and(count($fr))->toBeGreaterThan(1500)
        ->and($fr['Deals'])->toBe('Affaires')
        ->and($en['Deals'])->toBe('Deals')
        ->and($ar['Deals'])->toBe('الصفقات')
        ->and($ar['New conversation'])->toBe('محادثة جديدة')
        ->and($ar['Available'])->toBe('متاح')
        ->and($ar['Quotes'])->toBe('عروض الأسعار')
        ->and($ar['Win rate'])->toBe('نسبة الربح')
        ->and($ar['Any'])->toBe('أيّ')
        ->and($ar['Prev'])->toBe('السابق')
        ->and($ar['Columns'])->toBe('الأعمدة')
        ->and($ar['Deal evolution'])->toBe('تطور الصفقات')
        ->and($ar['Pipeline split'])->toBe('توزيع المسار')
        ->and($ar['By stage'])->toBe('حسب المرحلة')
        ->and($ar['Workspace ready'])->toBe('المساحة جاهزة')
        ->and($ar['Open deals'])->toBe('الصفقات المفتوحة')
        ->and($ar['Won this month'])->toBe('المكسب هذا الشهر')
        ->and($ar['Unweighted open value'])->toBe('القيمة المفتوحة غير المرجّحة')
        ->and($ar['Recent deals'])->toBe('أحدث الصفقات')
        ->and($ar['Deal name'])->toBe('اسم الصفقة')
        ->and($ar['Won deals'])->toBe('الصفقات الرابحة')
        ->and($ar['Last 7 days'])->toBe('آخر 7 أيام')
        ->and($ar['All :noun'])->toBe('كل :noun')
        ->and($ar['My :noun'])->toBe(':noun الخاصة بي')
        ->and($ar['Assigned to me'])->toBe('المعيّن لي')
        ->and($ar['Line items'])->toBe('بنود الصفقة')
        ->and($ar['Deal splits'])->toBe('تقسيم الصفقة')
        ->and($ar['owner'])->toBe('المالك')
        ->and($ar['admin'])->toBe('مدير')
        ->and($ar['member'])->toBe('عضو')
        ->and($ar['unread'])->toBe('غير مقروء')
        ->and($ar['Weighted'])->toBe('مرجّح')
        ->and($ar['List'])->toBe('قائمة')
        ->and($ar['Board'])->toBe('لوحة')
        ->and($ar['Board options'])->toBe('خيارات اللوحة')
        ->and($ar['Inbound'])->toBe('وارد')
        ->and($ar['Next action'])->toBe('الإجراء التالي')
        ->and($ar['1 quote'])->toBe('عرض واحد')
        ->and($ar['CRM operations'])->toBe('عمليات CRM')
        ->and($ar['All owners'])->toBe('كل المسؤولين')
        ->and($ar['Won in window'])->toBe('فازت في الفترة')
        ->and($ar['This open deal has no scheduled next action.'])->toBe('هذه الصفقة المفتوحة بلا إجراء تالٍ مجدول.');

    foreach ($fr as $key => $value) {
        preg_match_all('/:[A-Za-z][A-Za-z0-9_]*/', $key, $placeholders);

        foreach ($placeholders[0] as $placeholder) {
            expect($fr[$key])->toContain($placeholder)
                ->and($en[$key])->toContain($placeholder)
                ->and($ar[$key])->toContain($placeholder);
        }
    }
});

it('rejects duplicate or empty translation keys', function () {
    foreach (['fr', 'en', 'ar'] as $locale) {
        $raw = (string) file_get_contents(lang_path($locale.'.json'));
        preg_match_all('/^\s+"((?:\\\\.|[^"\\\\])*)"\s*:/m', $raw, $matches);
        $keys = $matches[1];

        expect($keys)->not->toBeEmpty()
            ->and(count($keys))->toBe(count(array_unique($keys)));

        foreach (json_decode($raw, true) as $key => $value) {
            expect($key)->not->toBe('')
                ->and($value)->toBeString()
                ->and($value)->not->toBe('');
        }
    }
});

it('resolves locale user then workspace then cookie then app default', function () {
    config()->set('app.locale', 'en');

    $user = User::factory()->create([
        'preferences' => null,
    ]);
    $user->workspace->forceFill(['preferences' => null])->save();

    $request = Request::create('/', 'GET');
    $request->cookies->set('locale', 'ar');

    expect(Locale::resolve($user, $request))->toBe('ar');

    $user->workspace->forceFill(['preferences' => ['locale' => 'fr']])->save();
    expect(Locale::resolve($user->fresh(), $request))->toBe('fr');

    $user->forceFill(['preferences' => ['locale' => 'en']])->save();
    expect(Locale::resolve($user->fresh(), $request))->toBe('en');

    $empty = Request::create('/', 'GET');
    $user->forceFill(['preferences' => null])->save();
    $user->workspace->forceFill(['preferences' => null])->save();
    expect(Locale::resolve($user->fresh(), $empty))->toBe('en');
});

it('persists the authenticated language preference and cookie', function () {
    $user = User::factory()->create(['preferences' => null]);

    $this->actingAs($user)
        ->from('/settings/appearance')
        ->post('/locale', ['locale' => 'ar'])
        ->assertRedirect('/settings/appearance')
        ->assertPlainCookie('locale', 'ar');

    expect($user->fresh()->preferences['locale'] ?? null)->toBe('ar');

    $this->actingAs($user->fresh())
        ->get('/dashboard')
        ->assertOk()
        ->assertSee('lang="ar"', false)
        ->assertSee('dir="rtl"', false)
        ->assertInertia(fn ($page) => $page
            ->where('locale', 'ar')
            ->where('dir', 'rtl')
            ->where('translations.Home', 'الرئيسية')
            ->where('translations.Inbox', 'صندوق الوارد')
            ->where('translations.Agents', 'الوكلاء'));
});

it('lets guests persist a pre-auth locale on login and register', function () {
    $this->withUnencryptedCookie('locale', 'ar')
        ->get(route('login'))
        ->assertOk()
        ->assertSee('lang="ar"', false)
        ->assertSee('dir="rtl"', false)
        ->assertInertia(fn ($page) => $page
            ->component('auth/login')
            ->where('locale', 'ar')
            ->where('translations.Log in', 'تسجيل الدخول'));

    $this->withUnencryptedCookie('locale', 'fr')
        ->get(route('register'))
        ->assertOk()
        ->assertSee('lang="fr"', false)
        ->assertSee('dir="ltr"', false)
        ->assertInertia(fn ($page) => $page
            ->where('locale', 'fr')
            ->where('translations.Register', 'Inscription'));
});

it('stamps LTR document direction for English and French', function () {
    $this->withUnencryptedCookie('locale', 'en')
        ->get(route('login'))
        ->assertOk()
        ->assertSee('lang="en"', false)
        ->assertSee('dir="ltr"', false);

    $this->withUnencryptedCookie('locale', 'fr')
        ->get(route('login'))
        ->assertOk()
        ->assertSee('lang="fr"', false)
        ->assertSee('dir="ltr"', false);
});

it('localizes validation, auth, and DataGrid chrome', function () {
    App::setLocale('ar');

    $validator = Validator::make(['email' => ''], ['email' => 'required']);

    expect($validator->errors()->first('email'))->toContain('إلزامي')
        ->and(__('auth.failed'))->toBe('بيانات الاعتماد هذه لا تطابق سجلاتنا.')
        ->and(__('Select all'))->not->toBe('Select all')
        ->and(__('No results'))->not->toBe('No results');

    App::setLocale('fr');

    expect(__('Select all'))->toBe('Tout sélectionner')
        ->and(__('Apply'))->toBe('Appliquer')
        ->and(__('auth.failed'))->toBe('Ces identifiants ne correspondent pas à nos enregistrements.');
});

it('localizes shell navigation and Agents chrome keys', function () {
    $user = User::factory()->create([
        'preferences' => ['locale' => 'ar'],
    ]);

    $this->actingAs($user)
        ->get('/agents')
        ->assertOk()
        ->assertSee('lang="ar"', false)
        ->assertSee('dir="rtl"', false)
        ->assertInertia(fn ($page) => $page
            ->component('agents/index')
            ->where('translations.New conversation', 'محادثة جديدة')
            ->where('translations.Available', 'متاح')
            ->where('translations.Your agents', 'وكلاؤك')
            ->where('translations.Contacts', 'جهات الاتصال'));
});

it('localizes Inbox chrome without translating message bodies', function () {
    $inbox = file_get_contents(resource_path('js/evo/inbox/MessageThread.tsx'));
    $user = User::factory()->create(['preferences' => ['locale' => 'fr']]);

    expect($inbox)
        ->toContain('dir="auto"')
        ->toContain("t('Private note, only visible to agents')")
        ->toContain('{message.body}');

    $this->actingAs($user)
        ->get('/inbox')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('locale', 'fr')
            ->where('translations.Inbox', 'Boîte de réception')
            ->where('translations.Unassigned', 'Non assigné'));
});

it('exposes the language selector on Preferences', function () {
    $user = User::factory()->create(['preferences' => ['locale' => 'fr']]);

    $this->actingAs($user)
        ->get(route('appearance.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/appearance')
            ->where('locale', 'fr')
            ->where('translations.Language', 'Langue')
            ->where('translations.Preferences', 'Préférences'));
});

it('localizes product emails to the recipient or workspace locale', function () {
    config(['mail.default' => 'resend']);
    Mail::fake();

    $workspace = Workspace::factory()->create([
        'preferences' => ['locale' => 'fr'],
    ]);
    $host = User::factory()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Amina',
    ]);
    $invitee = User::factory()->unverified()->create([
        'workspace_id' => $workspace->id,
        'email' => 'invite-ar@clinic.dz',
        'name' => 'Karim',
        'preferences' => ['locale' => 'ar'],
    ]);

    $result = app(WorkspaceInviteMailer::class)->send($invitee, $host);

    expect($result->ok())->toBeTrue();

    Mail::assertSent(WorkspaceInviteMail::class, function (WorkspaceInviteMail $mail) {
        expect($mail->locale)->toBe('ar');

        $rendered = $mail->render();

        expect($rendered)->toContain('تعيين كلمة المرور')
            ->and($mail->envelope()->subject)->toContain('EvoSales');

        return true;
    });

    $mailable = new MeetingBookedMail(
        guestName: 'Karim',
        hostName: 'Amina',
        whenLabel: 'Thu 10 Sep 2026 09:00',
        timezone: 'Africa/Algiers',
        locationNote: null,
        note: null,
    );

    app(MeetingMailer::class)->send($workspace, 'karim@clinic.dz', null, $mailable);

    Mail::assertSent(MeetingBookedMail::class, function (MeetingBookedMail $mail) {
        expect($mail->locale)->toBe('fr');

        App::setLocale('fr');
        expect(__('Meeting with :host — :when', [
            'host' => 'Amina',
            'when' => 'Thu 10 Sep 2026 09:00',
        ]))->toContain('Réunion');

        return true;
    });
});

it('source-locks customer-facing chrome onto t() on critical screens', function () {
    $files = [
        resource_path('js/pages/auth/login.tsx'),
        resource_path('js/pages/auth/register.tsx'),
        resource_path('js/pages/auth/auth-screen.tsx'),
        resource_path('js/pages/auth/reset-password.tsx'),
        resource_path('js/pages/auth/confirm-password.tsx'),
        resource_path('js/pages/settings/appearance.tsx'),
        resource_path('js/pages/home.tsx'),
        resource_path('js/pages/desk/inbox.tsx'),
        resource_path('js/pages/agents/index.tsx'),
        resource_path('js/pages/crm/contacts/index.tsx'),
        resource_path('js/components/language-selector.tsx'),
        resource_path('js/components/shell/evo-rail.tsx'),
    ];

    $allowed = [
        'EvoCrm',
        'EvoCRM',
        'EvoSales',
        'Evotechly',
        'DZD',
        'DA',
        'WhatsApp',
        'Apple',
        'Google',
    ];

    foreach ($files as $file) {
        $src = (string) file_get_contents($file);
        preg_match_all('/(?<![=])>\s*([A-Z][A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\'’ ,.—?-]{0,70})\s*</u', $src, $matches);

        foreach ($matches[1] as $text) {
            $text = trim($text);

            if ($text === '' || in_array($text, $allowed, true) || str_starts_with($text, '{')) {
                continue;
            }

            expect($text)->toBe(
                '',
                "Hardcoded chrome in {$file}: {$text}",
            );
        }
    }
});

it('rejects leftover physical directional Tailwind classes in evo chrome', function () {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(resource_path('js/evo')),
    );

    foreach ($iterator as $file) {
        if (! $file->isFile() || ! in_array($file->getExtension(), ['ts', 'tsx', 'css'], true)) {
            continue;
        }

        $path = $file->getPathname();

        if (str_contains($path, '/vendor/reui/')) {
            continue;
        }

        $src = (string) file_get_contents($path);

        expect($src)
            ->not->toMatch('/(?<![a-zA-Z])(?:ml|mr|pl|pr)-(?!auto\b)/')
            ->and($src)->not->toMatch('/(?<![a-zA-Z])text-(?:left|right)\b/');
    }
});

it('source-locks RTL shell, Arabic font, and Latin digits', function () {
    $css = file_get_contents(resource_path('css/evo-shell.css'));
    $tokens = file_get_contents(resource_path('js/evo/tokens/evo.css'));
    $format = file_get_contents(resource_path('js/evo/lib/format.ts'));
    $appCss = file_get_contents(resource_path('css/app.css'));
    $sidebar = file_get_contents(resource_path('js/components/desk/agents-sidebar.tsx'));
    $charts = file_get_contents(resource_path('js/evo/charts/frame.tsx'));
    $selector = file_get_contents(resource_path('js/components/language-selector.tsx'));
    $auth = file_get_contents(resource_path('js/pages/auth/auth-screen.tsx'));
    $appearance = file_get_contents(resource_path('js/pages/settings/appearance.tsx'));

    expect($css)
        ->toContain('border-inline-end: 1px solid var(--evo-hairline)')
        ->toContain('inset-inline-start: 0')
        ->toContain("[dir='rtl'] .evo-mode-off")
        ->and(file_get_contents(resource_path('js/components/shell/evo-rail.tsx')))
        ->toContain('rtl:rotate-180')
        ->toContain('text-start')
        ->and($tokens)
        ->toContain('--font-ui-arabic')
        ->toContain('IBM Plex Sans Arabic')
        ->toContain("html[dir='rtl']")
        ->and($appCss)
        ->toContain('@fontsource/ibm-plex-sans-arabic/400.css')
        ->and($format)
        ->toContain('numberingSystem: NUMBERING_SYSTEM')
        ->toContain("export const NUMBERING_SYSTEM = 'latn'")
        ->and($sidebar)
        ->toContain("t('Your agents')")
        ->toContain("t('New conversation')")
        ->and($charts)
        ->toContain('data-chart-plot="ltr"')
        ->and($selector)
        ->toContain('data-language-selector="full"')
        ->toContain('data-language-selector="compact"')
        ->toContain("label: 'العربية'")
        ->and($auth)
        ->toContain('<LanguageSelector compact')
        ->and($appearance)
        ->toContain('<LanguageSelector');
});

it('source-locks LTR isolation and DA money helpers', function () {
    $money = file_get_contents(resource_path('js/lib/money.ts'));
    $ltr = file_get_contents(resource_path('js/components/ltr-value.tsx'));
    $cells = file_get_contents(resource_path('js/evo/data/crm-list/cells.tsx'));
    $chooser = file_get_contents(resource_path('js/components/crm/column-chooser.tsx'));
    $mode = file_get_contents(resource_path('js/evo/shell/mode-switch.tsx'));
    $home = file_get_contents(resource_path('js/pages/home.tsx'));
    $kpi = file_get_contents(resource_path('js/components/dashboard/home-kpi-strip.tsx'));

    expect($money)
        ->toContain("const CURRENCY_SUFFIX = 'DA'")
        ->not->toContain("' DZD'")
        ->not->toContain("currency: 'DZD'")
        ->and($ltr)
        ->toContain('dir="ltr"')
        ->toContain('unicodeBidi')
        ->and($cells)
        ->toContain('LtrValue')
        ->toContain('formatPhone')
        ->toContain('dir="auto"')
        ->and(file_get_contents(resource_path('js/components/shell/evo-rail.tsx')))
        ->toContain('text-start')
        ->toContain('rtl:rotate-180')
        ->not->toContain('workspaceRoleLabel')
        ->and(file_get_contents(resource_path('js/components/crm/deal-line-items.tsx')))
        ->toContain("t('Line items')")
        ->and(file_get_contents(resource_path('js/components/crm/deal-forecast-bar.tsx')))
        ->toContain("t('Open deals')")
        ->and(file_get_contents(resource_path('js/evo/inbox/ConversationRow.tsx')))
        ->toContain("t('unread')")
        ->and($chooser)
        ->toContain("t('Columns')")
        ->and($mode)
        ->toContain('aria-label={label}')
        ->not->toContain('truncate')
        ->and($home)
        ->toContain('formatCompactDzd')
        ->toContain('dir="auto"')
        ->not->toContain("replace(' DZD'")
        ->and($kpi)
        ->toContain('formatCompactDzd')
        ->toContain('t(kpi.label)');
});

it('formats home dates with the UI locale and Latin digits', function () {
    $user = User::factory()->create(['preferences' => ['locale' => 'ar']]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('locale', 'ar')
            ->where('context.date', fn ($date) => is_string($date)
                && ! preg_match('/Friday|October|January|February|March|April|May|June|July|August|September|November|December/', $date)
                && ! preg_match('/[٠-٩۰-۹]/u', $date)));
});
