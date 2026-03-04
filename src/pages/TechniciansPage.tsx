import TechniciansSection from '../features/technicians/components/TechniciansSection';
import { mockTechnicians } from '../features/technicians/api/mockData';

export function TechniciansPage() {
    return <TechniciansSection technicians={mockTechnicians} />;
}
