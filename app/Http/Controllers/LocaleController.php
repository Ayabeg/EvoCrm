<?php

namespace App\Http\Controllers;

use App\Support\Locale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LocaleController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $locale = Locale::normalize($request->input('locale'));

        abort_unless($locale !== null, 422);

        $user = $request->user();

        if ($user) {
            $user->forceFill([
                'preferences' => Locale::mergePreference($user->preferences, $locale),
            ])->save();
        }

        return back()->withCookie(Locale::cookie($locale));
    }
}
