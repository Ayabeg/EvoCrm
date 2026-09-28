<?php

namespace App\Http\Controllers\Desk;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class AgentsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('agents/index', [
            'chats' => [],
            'customBots' => [],
        ]);
    }

    public function chats(): Response
    {
        return $this->index();
    }

    public function chat(string $chat): Response
    {
        return $this->index();
    }

    public function bots(): Response
    {
        return $this->index();
    }

    public function newBot(): Response
    {
        return $this->index();
    }

    public function bot(string $bot): Response
    {
        return $this->index();
    }
}
