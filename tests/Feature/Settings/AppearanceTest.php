<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppearanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_appearance_page_is_displayed()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('appearance.edit'));

        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page->component('settings/appearance')
        );
    }

    public function test_html_root_carries_dark_class_only_when_dark_is_chosen()
    {
        $response = $this->withUnencryptedCookie('appearance', 'dark')->get(route('login'));

        $response->assertOk();
        $this->assertStringContainsString('class="dark"', $response->getContent());
        $this->assertStringContainsString('data-theme="dark"', $response->getContent());
    }

    public function test_html_root_has_no_dark_class_for_light_or_system()
    {
        $light = $this->withUnencryptedCookie('appearance', 'light')->get(route('login'));
        $light->assertOk();
        $this->assertStringNotContainsString('class="dark"', $light->getContent());

        $system = $this->withUnencryptedCookie('appearance', 'system')->get(route('login'));
        $system->assertOk();
        $this->assertStringNotContainsString('class="dark"', $system->getContent());

        $unset = $this->get(route('login'));
        $unset->assertOk();
        $this->assertStringNotContainsString('class="dark"', $unset->getContent());
    }

    public function test_dark_choice_is_reflected_in_the_inline_theme_script()
    {
        $response = $this->withUnencryptedCookie('appearance', 'dark')->get(route('login'));

        $response->assertOk();
        $this->assertStringContainsString('const appearance = "dark"', $response->getContent());
    }
}
