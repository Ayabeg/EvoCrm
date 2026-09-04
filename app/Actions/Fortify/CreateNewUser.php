<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Identity\WorkspaceProvisioner;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);

        app(WorkspaceProvisioner::class)->provision(
            config('evosales.company', 'Evotechly'),
            $user,
        );

        $user = $user->fresh() ?? $user;
        $analytics = app(ProductAnalytics::class);
        $analytics->identify($user, $user->workspace);
        $analytics->capture(ProductAnalytics::USER_SIGNED_UP, [
            'email' => $user->email,
        ], $user, $user->workspace);

        return $user;
    }
}
