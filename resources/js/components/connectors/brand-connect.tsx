import { FacebookMark } from '@/components/brand/marks';
import { OAuthPopupButton } from '@/components/connectors/oauth-popup-button';
import { t } from '@/lib/i18n';

export function BrandConnectButtons({
    facebookUrl,
}: {
    facebookUrl?: string | null;
    instagramUrl?: string | null;
}) {
    return (
        <OAuthPopupButton
            href={facebookUrl || '/auth/meta?popup=1'}
            className="gap-2"
        >
            <FacebookMark className="size-4" />
            {t('Continue with Facebook')}
        </OAuthPopupButton>
    );
}
