import { ReportsShell } from '@/components/crm/reports-shell';
import { ReportBuilderForm } from '@/evo/reports';
import type { CrossObjectReport, ReportResult, SavedReportRow } from '@/evo/reports';
import { t } from '@/lib/i18n';

export default function ReportBuilder({
    reports = [],
    result,
    activeReport,
    crossObject,
}: {
    reports?: SavedReportRow[];
    result?: ReportResult;
    activeReport?: SavedReportRow | null;
    crossObject?: CrossObjectReport;
}) {
    return (
        <ReportsShell
            title="Report builder"
            pageTitle="Report builder"
            description={t('Save ad hoc CRM reports with filters and grouping.')}
        >
            <ReportBuilderForm
                reports={reports}
                result={result}
                activeReport={activeReport}
                crossObject={crossObject}
            />
        </ReportsShell>
    );
}
