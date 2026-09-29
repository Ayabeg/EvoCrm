import { Head, Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { t } from '@/lib/i18n';
import { home } from '@/routes';

export default function Privacy() {
    return (
        <>
            <Head title={t('Privacy Policy')} />
            <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col px-5 py-10 sm:px-8">
                <Link href={home()} className="flex items-center gap-2 text-ink">
                    <AppLogoIcon className="size-8" />
                    <span className="text-sm font-semibold tracking-tight">
                        EvoCrm
                    </span>
                </Link>
                <h1 className="mt-10 text-xl font-semibold tracking-tight text-ink">
                    {t('Privacy Policy')}
                </h1>
                <p className="mt-4 text-sm leading-6 text-mute">
                    {t(
                        'This is a placeholder. EvoCrm\'s Privacy Policy will be published here.',
                    )}
                </p>
                <p className="mt-8 text-sm">
                    <Link href={home()} className="text-ink underline underline-offset-2">
                        {t('Back to EvoCrm')}
                    </Link>
                </p>
            </div>
        </>
    );
}
