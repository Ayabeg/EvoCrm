<?php

namespace App\Services\LeadOs;

use Illuminate\Support\Facades\Artisan;
use Throwable;

/**
 * Dispatch a named Artisan command if a parallel PR has registered it.
 * Missing commands are a clean skip — never invent their tables.
 */
class SiblingCommand
{
    /**
     * @param  array<string, mixed>  $parameters
     * @return array{status: string, counts: array<string, int>, error: string|null}
     */
    public function invoke(string $signature, array $parameters = []): array
    {
        if (! $this->registered($signature)) {
            return [
                'status' => 'skipped',
                'counts' => ['commands' => 0],
                'error' => $signature.' is not registered',
            ];
        }

        try {
            $exit = Artisan::call($signature, $this->acceptedParameters($signature, $parameters));
        } catch (Throwable $e) {
            return [
                'status' => 'failed',
                'counts' => ['commands' => 0],
                'error' => $e->getMessage(),
            ];
        }

        if ($exit !== 0) {
            return [
                'status' => 'failed',
                'counts' => ['commands' => 1],
                'error' => trim(Artisan::output()) ?: $signature.' exited '.$exit,
            ];
        }

        return [
            'status' => 'ok',
            'counts' => ['commands' => 1],
            'error' => null,
        ];
    }

    public function registered(string $signature): bool
    {
        return array_key_exists($signature, Artisan::all());
    }

    /**
     * @param  array<string, mixed>  $parameters
     * @return array<string, mixed>
     */
    protected function acceptedParameters(string $signature, array $parameters): array
    {
        $command = Artisan::all()[$signature] ?? null;

        if (! $command) {
            return [];
        }

        $definition = $command->getDefinition();
        $accepted = [];

        foreach ($parameters as $name => $value) {
            $option = ltrim((string) $name, '-');

            if ($definition->hasOption($option) || $definition->hasArgument($option)) {
                $accepted[$name] = $value;
            }
        }

        return $accepted;
    }
}
