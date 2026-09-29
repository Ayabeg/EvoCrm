<?php

it('renders the terms placeholder', function () {
    $this->get(route('legal.terms'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('public/terms'));
});

it('renders the privacy placeholder', function () {
    $this->get(route('legal.privacy'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('public/privacy'));
});
