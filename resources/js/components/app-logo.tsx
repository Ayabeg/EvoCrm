import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <AppLogoIcon className="size-7" />
            <div className="ml-1.5 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-semibold tracking-tight text-ink">
                    EvoCrm
                </span>
            </div>
        </>
    );
}
