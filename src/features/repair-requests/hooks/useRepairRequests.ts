import { useContext } from 'react';
import { RepairRequestContext } from '../contexts/RepairRequestContextObject';

export const useRepairRequests = () => {
    const context = useContext(RepairRequestContext);
    if (context === undefined) {
        throw new Error('useRepairRequests must be used within a RepairRequestProvider');
    }
    return context;
};
