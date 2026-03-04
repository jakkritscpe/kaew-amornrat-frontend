import { createContext } from 'react';
import type { RepairRequest } from '../types';
import { mockStats } from '../../dashboard/api/mockData';

export interface RepairRequestContextType {
    requests: RepairRequest[];
    stats: typeof mockStats;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredRequests: RepairRequest[];
    isNewRequestModalOpen: boolean;
    setIsNewRequestModalOpen: (isOpen: boolean) => void;
    selectedRequest: RepairRequest | null;
    setSelectedRequest: (request: RepairRequest | null) => void;
    isDetailModalOpen: boolean;
    setIsDetailModalOpen: (isOpen: boolean) => void;
    editRequest: RepairRequest | null;
    setEditRequest: (request: RepairRequest | null) => void;
    handleNewRequest: (formData: Omit<RepairRequest, 'id' | 'createdAt' | 'status'>) => void;
    handleEditRequest: (formData: Omit<RepairRequest, 'id' | 'createdAt' | 'status'>) => void;
    handleUpdateStatus: (id: string, newStatus: string) => void;
    handleViewRequest: (request: RepairRequest) => void;
    handleEditClick: (request: RepairRequest) => void;
}

export const RepairRequestContext = createContext<RepairRequestContextType | undefined>(undefined);
