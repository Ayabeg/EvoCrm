import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import FilterBuilder from '@/components/crm/filter-builder';
import { filterFields } from '@/components/crm/list-query';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import type { ListFieldDef, ListViewFilters } from '@/lib/list-view-config';
import { filterGroupsFromActive } from '@/lib/list-view-config';
import type { DataWorkspaceEntity, DataWorkspaceFilterContext } from '@/ds/workspace/types';

export function AdvancedFilterDrawer({
    open,
    onOpenChange,
    object,
    basePath,
    filters,
    filterFields: fieldDefs,
    filterContext,
    extraQuery = {},
    onFiltersChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    object: DataWorkspaceEntity;
    basePath: string;
    filters: Record<string, unknown>;
    filterFields: ListFieldDef[];
    filterContext?: DataWorkspaceFilterContext;
    extraQuery?: Record<string, string | number | null | undefined>;
    onFiltersChange: (next: ListViewFilters) => void;
}) {
    const fields = filterFields(filters);
    const cities = filterContext?.cities ?? [];
    const wilayas = filterContext?.wilayas ?? [];
    const [groups, setGroups] = useState<ListViewFilters>(() =>
        filterGroupsFromActive(filters),
    );

    useEffect(() => {
        setGroups(filterGroupsFromActive(filters));
    }, [filters]);

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent
                side="right"
                className="w-[min(420px,92vw)]"
                data-ds="advanced-filter-drawer"
            >
                <DrawerHeader>
                    <DrawerTitle>Advanced filters</DrawerTitle>
                </DrawerHeader>
                <Form
                    action={basePath}
                    method="get"
                    className="flex min-h-0 flex-1 flex-col"
                    onSuccess={() => {
                        onFiltersChange(groups);
                        onOpenChange(false);
                    }}
                >
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                        {Object.entries(extraQuery).map(([key, value]) =>
                            value === null || value === undefined || value === '' ? null : (
                                <input key={key} type="hidden" name={key} value={String(value)} />
                            ),
                        )}
                        <input type="hidden" name="view" value={String(fields.view ?? 'all')} />
                        {fields.filter_id ? (
                            <input type="hidden" name="filter_id" value={String(fields.filter_id)} />
                        ) : null}
                        {fields.q ? <input type="hidden" name="q" value={String(fields.q)} /> : null}
                        {fields.owner ? (
                            <input type="hidden" name="owner" value={String(fields.owner)} />
                        ) : null}
                        {fields.created ? (
                            <input type="hidden" name="created" value={String(fields.created)} />
                        ) : null}
                        {fields.status ? (
                            <input type="hidden" name="status" value={String(fields.status)} />
                        ) : null}
                        {fields.stage ? (
                            <input type="hidden" name="stage" value={String(fields.stage)} />
                        ) : null}
                        {fieldDefs.length > 0 ? (
                            <FilterBuilder
                                entity={object}
                                fields={fieldDefs}
                                value={groups}
                                onChange={setGroups}
                                members={filterContext?.members ?? []}
                                cities={cities}
                                wilayas={wilayas}
                                stages={filterContext?.stages ?? []}
                            />
                        ) : null}
                        {cities.length > 0 ? (
                            <label className="grid gap-1 text-[13px] text-ink">
                                City
                                <select
                                    key={`city:${String(fields.city ?? '')}`}
                                    name="city"
                                    defaultValue={String(fields.city ?? '')}
                                    className="h-9 rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                                >
                                    <option value="">Any</option>
                                    {cities.map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : null}
                        {wilayas.length > 0 ? (
                            <label className="grid gap-1 text-[13px] text-ink">
                                Wilaya
                                <select
                                    key={`wilaya:${String(fields.wilaya ?? '')}`}
                                    name="wilaya"
                                    defaultValue={String(fields.wilaya ?? '')}
                                    className="h-9 rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                                >
                                    <option value="">Any</option>
                                    {wilayas.map((wilaya) => (
                                        <option key={wilaya} value={wilaya}>
                                            {wilaya}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : null}
                        <label className="flex h-9 items-center gap-2 text-[13px] text-ink">
                            <input
                                key={`unanswered:${fields.unanswered ? '1' : '0'}`}
                                type="checkbox"
                                name="unanswered"
                                value="1"
                                defaultChecked={!!fields.unanswered}
                            />
                            Unanswered
                        </label>
                        <label className="flex h-9 items-center gap-2 text-[13px] text-ink">
                            <input
                                key={`unassigned:${fields.unassigned ? '1' : '0'}`}
                                type="checkbox"
                                name="unassigned"
                                value="1"
                                defaultChecked={!!fields.unassigned}
                            />
                            Unassigned
                        </label>
                    </div>
                    <DrawerFooter className="flex flex-row justify-end gap-2 border-t border-hairline px-5 py-3">
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-9"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="h-9">
                            Apply
                        </Button>
                    </DrawerFooter>
                </Form>
            </DrawerContent>
        </Drawer>
    );
}
