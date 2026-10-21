<?php

namespace App\Services\LeadMagnet;

use InvalidArgumentException;

/**
 * Calculates an estimate from assumptions supplied by the user.
 *
 * The leakage stages are sequential so the same inquiry is not counted twice:
 * missed inquiries are removed first, then delayed responses, then follow-up
 * drop-off. No industry averages or product claims are introduced here.
 */
final class LeadLeakageCalculator
{
    private const VERSION = 'lead-leakage-v1';

    /**
     * @param  array{
     *     monthly_inquiries: int|float|string,
     *     average_customer_value: int|float|string,
     *     inquiry_to_customer_rate: int|float|string,
     *     missed_inquiry_rate: int|float|string,
     *     delayed_response_rate: int|float|string,
     *     follow_up_dropoff_rate: int|float|string
     * }  $input
     * @return array{
     *     version: string,
     *     assumptions: array<string, int|float>,
     *     stages: list<array{key: string, label: string, starting_inquiries: float, loss_rate_percent: float, lost_inquiries: float, remaining_inquiries: float}>,
     *     monthly_inquiries: int,
     *     total_lost_inquiries: float,
     *     leakage_rate_percent: float,
     *     expected_customers_lost: float,
     *     estimated_revenue_at_risk: float,
     *     estimated_revenue_retained_after_process_improvement: float
     * }
     */
    public function calculate(array $input): array
    {
        $monthlyInquiries = $this->integer($input, 'monthly_inquiries');
        $averageCustomerValue = $this->percentageOrAmount($input, 'average_customer_value', allowAboveOneHundred: true);
        $conversionRate = $this->percentageOrAmount($input, 'inquiry_to_customer_rate');
        $rates = [
            'missed_inquiry_rate' => $this->percentageOrAmount($input, 'missed_inquiry_rate'),
            'delayed_response_rate' => $this->percentageOrAmount($input, 'delayed_response_rate'),
            'follow_up_dropoff_rate' => $this->percentageOrAmount($input, 'follow_up_dropoff_rate'),
        ];

        $labels = [
            'missed_inquiry_rate' => 'Missed inquiries',
            'delayed_response_rate' => 'Delayed responses',
            'follow_up_dropoff_rate' => 'Follow-up drop-off',
        ];
        $remaining = (float) $monthlyInquiries;
        $stages = [];

        foreach ($rates as $key => $rate) {
            $starting = $remaining;
            $lost = round($starting * ($rate / 100), 2);
            $remaining = round(max(0, $starting - $lost), 2);
            $stages[] = [
                'key' => $key,
                'label' => $labels[$key],
                'starting_inquiries' => $starting,
                'loss_rate_percent' => $rate,
                'lost_inquiries' => $lost,
                'remaining_inquiries' => $remaining,
            ];
        }

        $totalLost = round(max(0, $monthlyInquiries - $remaining), 2);
        $leakageRate = $monthlyInquiries > 0
            ? round(($totalLost / $monthlyInquiries) * 100, 2)
            : 0.0;
        $expectedCustomersLost = round($totalLost * ($conversionRate / 100), 2);
        $revenueAtRisk = round($expectedCustomersLost * $averageCustomerValue, 2);
        $retainedRevenue = round($remaining * ($conversionRate / 100) * $averageCustomerValue, 2);

        return [
            'version' => self::VERSION,
            'assumptions' => [
                'monthly_inquiries' => $monthlyInquiries,
                'average_customer_value' => $averageCustomerValue,
                'inquiry_to_customer_rate' => $conversionRate,
                ...$rates,
            ],
            'stages' => $stages,
            'monthly_inquiries' => $monthlyInquiries,
            'total_lost_inquiries' => $totalLost,
            'leakage_rate_percent' => $leakageRate,
            'expected_customers_lost' => $expectedCustomersLost,
            'estimated_revenue_at_risk' => $revenueAtRisk,
            'estimated_revenue_retained_after_process_improvement' => $retainedRevenue,
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function integer(array $input, string $key): int
    {
        $value = $this->number($input, $key);

        if (floor($value) !== $value) {
            throw new InvalidArgumentException($key.' must be a whole number.');
        }

        return (int) $value;
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function percentageOrAmount(array $input, string $key, bool $allowAboveOneHundred = false): float
    {
        $value = $this->number($input, $key);

        if (! $allowAboveOneHundred && $value > 100) {
            throw new InvalidArgumentException($key.' must be between 0 and 100.');
        }

        return round($value, 2);
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function number(array $input, string $key): float
    {
        $value = $input[$key] ?? null;

        if (is_bool($value) || $value === null || $value === '' || ! is_numeric($value)) {
            throw new InvalidArgumentException($key.' must be numeric.');
        }

        $number = (float) $value;

        if (! is_finite($number) || $number < 0) {
            throw new InvalidArgumentException($key.' must be zero or greater.');
        }

        return $number;
    }
}
