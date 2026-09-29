<?php

use Illuminate\Support\Facades\Route;

it('points every routed controller action at a real method', function () {
    $missing = [];

    foreach (Route::getRoutes() as $route) {
        $action = $route->getAction();
        $uses = $action['controller'] ?? $action['uses'] ?? null;

        if (! is_string($uses) || $uses === 'Closure') {
            continue;
        }

        if (str_contains($uses, '@')) {
            [$class, $method] = explode('@', $uses, 2);
        } elseif (str_contains($uses, '::')) {
            [$class, $method] = explode('::', $uses, 2);
        } else {
            $class = $uses;
            $method = '__invoke';
        }

        if (! class_exists($class) || ! method_exists($class, $method)) {
            $missing[] = $route->methods()[0].' '.$route->uri().' → '.$class.'::'.$method;
        }
    }

    expect($missing)->toBe([]);
});
