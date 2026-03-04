import { useRepairRequests } from '../features/repair-requests/hooks/useRepairRequests';
import RequestsTable from '../features/repair-requests/components/RequestsTable';

export function RequestsPage() {
    const {
        filteredRequests,
        handleViewRequest,
        handleEditClick,
        handleUpdateStatus
    } = useRepairRequests();

    return (
        <div className="space-y-6">
            <RequestsTable
                requests={filteredRequests}
                onViewRequest={handleViewRequest}
                onEditRequest={handleEditClick}
                onUpdateStatus={handleUpdateStatus}
            />
        </div>
    );
}
