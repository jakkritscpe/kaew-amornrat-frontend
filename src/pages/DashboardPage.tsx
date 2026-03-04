import Dashboard from '../features/dashboard/components/Dashboard';
import { useRepairRequests } from '../features/repair-requests/hooks/useRepairRequests';

export function DashboardPage() {
    const {
        stats,
        filteredRequests,
        handleViewRequest,
        handleEditClick,
        handleUpdateStatus
    } = useRepairRequests();

    return (
        <Dashboard
            stats={stats}
            requests={filteredRequests}
            onViewRequest={handleViewRequest}
            onEditRequest={handleEditClick}
            onUpdateStatus={handleUpdateStatus}
        />
    );
}
