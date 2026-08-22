<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\MailboxFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'workspace_id',
    'name',
    'from_name',
    'from_address',
    'host',
    'port',
    'encryption',
    'username',
    'password',
    'is_default',
    'enabled',
])]
#[Hidden(['password'])]
class Mailbox extends Model
{
    /** @use HasFactory<MailboxFactory> */
    use BelongsToWorkspace, HasFactory;

    protected function casts(): array
    {
        return [
            'password' => 'encrypted',
            'is_default' => 'boolean',
            'enabled' => 'boolean',
        ];
    }
}
