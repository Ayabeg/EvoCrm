<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function pause(Request $request, Enrollment $enrollment): RedirectResponse
    {
        $this->authorizeWorkspace($request, $enrollment);

        if ($enrollment->status === 'active') {
            $enrollment->forceFill(['status' => 'paused'])->save();
        }

        return back();
    }

    public function resume(Request $request, Enrollment $enrollment): RedirectResponse
    {
        $this->authorizeWorkspace($request, $enrollment);

        if ($enrollment->status === 'paused') {
            $enrollment->forceFill([
                'status' => 'active',
                'next_run_at' => $enrollment->next_run_at ?? now(),
            ])->save();
        }

        return back();
    }

    public function cancel(Request $request, Enrollment $enrollment): RedirectResponse
    {
        $this->authorizeWorkspace($request, $enrollment);

        $enrollment->forceFill(['status' => 'cancelled', 'next_run_at' => null])->save();

        return back();
    }

    protected function authorizeWorkspace(Request $request, Enrollment $enrollment): void
    {
        abort_unless((int) $enrollment->workspace_id === (int) $request->user()->workspace_id, 404);
    }
}
