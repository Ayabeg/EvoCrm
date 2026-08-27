<?php

namespace App\Support;

final class AlgerianWilaya
{
    /**
     * Official 58 wilayas, French CRM spelling used across EvoSales.
     *
     * @var list<string>
     */
    public const NAMES = [
        'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
        'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger',
        'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma',
        'Constantine', 'Médéa', 'Mostaganem', "M'Sila", 'Mascara', 'Ouargla', 'Oran', 'El Bayadh',
        'Illizi', 'Bordj Bou Arreridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued',
        'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
        'Ghardaïa', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal', 'Béni Abbès',
        'In Salah', 'In Guezzam', 'Touggourt', 'Djanet', "El M'Ghair", 'El Meniaa',
    ];

    private const ALIASES = [
        'algiers' => 'Alger',
        'alger centre' => 'Alger',
        'alger-centre' => 'Alger',
        'setif' => 'Sétif',
        'bejaia' => 'Béjaïa',
        'bejaïa' => 'Béjaïa',
        'bejaya' => 'Béjaïa',
        'tizi-ouzou' => 'Tizi Ouzou',
        'tiziouzou' => 'Tizi Ouzou',
        'sidi bel abbes' => 'Sidi Bel Abbès',
        'sidi-bel-abbes' => 'Sidi Bel Abbès',
        'msila' => "M'Sila",
        'm sila' => "M'Sila",
        'medea' => 'Médéa',
        'tebesa' => 'Tébessa',
        'bechar' => 'Béchar',
        'boumerdes' => 'Boumerdès',
        'ain defla' => 'Aïn Defla',
        'ain temouchent' => 'Aïn Témouchent',
        'el eulma' => 'Sétif',
        'hydra' => 'Alger',
        'bir mourad rais' => 'Alger',
        '16' => 'Alger',
        '31' => 'Oran',
        '25' => 'Constantine',
        '19' => 'Sétif',
        '06' => 'Béjaïa',
        '6' => 'Béjaïa',
    ];

    public static function normalize(?string $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        $value = trim($raw);

        if ($value === '') {
            return null;
        }

        $folded = self::fold($value);

        if (isset(self::ALIASES[$folded])) {
            return self::ALIASES[$folded];
        }

        foreach (self::NAMES as $name) {
            if (self::fold($name) === $folded) {
                return $name;
            }
        }

        return $value;
    }

    public static function extract(?string $address): ?string
    {
        if ($address === null || trim($address) === '') {
            return null;
        }

        foreach (preg_split('/[,\/|]+/', $address) ?: [] as $part) {
            $normalized = self::normalize(trim($part));

            if ($normalized !== null && in_array($normalized, self::NAMES, true)) {
                return $normalized;
            }
        }

        foreach (self::NAMES as $name) {
            if (str_contains(self::fold($address), self::fold($name))) {
                return $name;
            }
        }

        return null;
    }

    public static function isKnown(?string $name): bool
    {
        $normalized = self::normalize($name);

        return $normalized !== null && in_array($normalized, self::NAMES, true);
    }

    private static function fold(string $value): string
    {
        $value = mb_strtolower(trim($value));
        $value = strtr($value, [
            'à' => 'a', 'á' => 'a', 'â' => 'a', 'ä' => 'a', 'ã' => 'a',
            'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e',
            'ì' => 'i', 'í' => 'i', 'î' => 'i', 'ï' => 'i',
            'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'ö' => 'o',
            'ù' => 'u', 'ú' => 'u', 'û' => 'u', 'ü' => 'u',
            'ç' => 'c', 'ñ' => 'n', '’' => "'", 'ʿ' => '',
            'ā' => 'a', 'ī' => 'i', 'ū' => 'u',
        ]);

        $value = preg_replace('/\s+/', ' ', $value) ?? $value;

        return $value;
    }
}
