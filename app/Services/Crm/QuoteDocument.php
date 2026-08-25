<?php

namespace App\Services\Crm;

use App\Models\Quote;
use Illuminate\Support\Str;

class QuoteDocument
{
    /**
     * @return array{html: string, snapshot: array<string, mixed>}
     */
    public function snapshot(Quote $quote): array
    {
        $quote->loadMissing(['items', 'deal.contact', 'deal.company', 'deal.owner', 'workspace']);

        $snapshot = [
            'quote_id' => $quote->id,
            'status' => $quote->status,
            'currency' => $quote->currency,
            'total_cents' => (int) $quote->total_cents,
            'notes' => $quote->notes,
            'expires_at' => $quote->expires_at?->toDateString(),
            'customer' => [
                'contact' => $quote->deal?->contact?->displayName(),
                'email' => $quote->deal?->contact?->email,
                'company' => $quote->deal?->company?->name,
            ],
            'seller' => [
                'workspace' => $quote->workspace?->name ?? 'EvoSales',
                'owner' => $quote->deal?->owner?->name,
            ],
            'items' => $quote->items->map(fn ($item) => [
                'name' => $item->name,
                'quantity' => (int) $item->quantity,
                'unit_cents' => (int) $item->unit_cents,
                'total_cents' => (int) $item->total_cents,
            ])->all(),
        ];

        $lines = collect($snapshot['items'])->map(function (array $item): string {
            $unit = number_format($item['unit_cents'] / 100, 2, ',', ' ');
            $total = number_format($item['total_cents'] / 100, 2, ',', ' ');

            return '<tr><td>'.e($item['name']).'</td><td>'.$item['quantity'].'</td><td>'.$unit.'</td><td>'.$total.'</td></tr>';
        })->implode('');

        $html = '<html><body><h1>Quote '.e((string) $quote->id).'</h1>'
            .'<p>Customer: '.e((string) ($snapshot['customer']['contact'] ?? '—')).'</p>'
            .'<p>Seller: '.e((string) $snapshot['seller']['workspace']).'</p>'
            .'<table><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>'
            .$lines
            .'</tbody></table>'
            .'<p>Total: '.number_format(((int) $quote->total_cents) / 100, 2, ',', ' ').' '.$quote->currency.'</p>'
            .(filled($quote->notes) ? '<p>Notes: '.e((string) $quote->notes).'</p>' : '')
            .'</body></html>';

        return ['html' => $html, 'snapshot' => $snapshot];
    }

    public function freeze(Quote $quote): Quote
    {
        if (filled($quote->snapshot_html)) {
            return $quote;
        }

        $document = $this->snapshot($quote);
        $quote->forceFill([
            'snapshot_html' => $document['html'],
            'snapshot' => $document['snapshot'],
        ])->save();

        return $quote->fresh() ?? $quote;
    }

    public function pdf(Quote $quote): string
    {
        $quote = $this->freeze($quote);
        $text = trim(html_entity_decode(strip_tags((string) $quote->snapshot_html), ENT_QUOTES, 'UTF-8'));
        $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
        $stream = 'BT /F1 11 Tf 48 760 Td ('.Str::limit($escaped, 1800, '').') Tj ET';
        $length = strlen($stream);

        return "%PDF-1.4\n"
            ."1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n"
            ."2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n"
            ."3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n"
            ."4 0 obj<< /Length {$length} >>stream\n{$stream}\nendstream\nendobj\n"
            ."5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n"
            ."xref\n0 6\n0000000000 65535 f \ntrailer<< /Size 6 /Root 1 0 R >>\nstartxref\n0\n%%EOF";
    }
}
