import { fetchProperties } from '@/lib/server/admin-data';
import { PropertiesManager } from '@/components/admin/PropertiesManager';

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
  const properties = await fetchProperties();
  return (
    <div>
      <h1 className="text-2xl font-bold text-on-surface mb-6">Properties</h1>
      <PropertiesManager initial={properties} />
    </div>
  );
}
