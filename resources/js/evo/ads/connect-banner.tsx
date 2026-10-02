import { OAuthPopupButton } from '@/components/connectors/oauth-popup-button';
import type { AdsMetaStatus } from '@/evo/ads/types';
import { Callout } from '@/evo/ui/callout';
import { t } from '@/lib/i18n';

export function AdsConnectBanner({ meta }: { meta: AdsMetaStatus }) {
    if (meta.connected && !meta.reason) {
        return null;
    }

    return (
        <Callout variant="info" title={t(meta.connected ? 'Meta connected' : 'Connect Meta Ads')}>
            <div className="space-y-2">
                {meta.reason ? (
                    <p>{meta.reason}</p>
                ) : (
                    <p>
                        {t(
                            'Ingest lead forms and campaign stats into this workspace.',
                        )}
                    </p>
                )}
                {!meta.connected ? (
                    <>
                        <OAuthPopupButton href={meta.connect_url ?? '/auth/meta?popup=1'}>
                            {t('Continue with Facebook')}
                        </OAuthPopupButton>
                        <p className="text-[12px] text-[var(--evo-ink-muted)]">
                            {t(
                                'Log in with Facebook in the popup. Lead forms POST to the workspace webhook and create Contact + Lead.',
                            )}
                        </p>
                    </>
                ) : null}
            </div>
        </Callout>
    );
}
