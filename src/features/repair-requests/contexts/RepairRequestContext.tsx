import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { RepairRequest } from '../types';
import { mockRequests } from '../api/mockData';
import { mockStats } from '../../dashboard/api/mockData';
import { RepairRequestContext } from './RepairRequestContextObject';

export function RepairRequestProvider({ children }: { children: ReactNode }) {
    const [searchQuery, setSearchQuery] = useState('');

    const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editRequest, setEditRequest] = useState<RepairRequest | null>(null);

    // State for requests (to allow updates)
    const [requests, setRequests] = useState<RepairRequest[]>(mockRequests);
    const [stats, setStats] = useState(mockStats);

    // Filter requests based on search
    const filteredRequests = requests.filter(request =>
        request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.technician.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle new request submission
    const handleNewRequest = useCallback((formData: Omit<RepairRequest, 'id' | 'createdAt' | 'status'>) => {
        const newRequest: RepairRequest = {
            ...formData,
            id: `REQ-${String(requests.length + 1).padStart(3, '0')}`,
            createdAt: new Date().toISOString().split('T')[0],
            status: 'pending'
        };

        setRequests(prev => [newRequest, ...prev]);

        // Update stats
        setStats(prev => ({
            ...prev,
            total: prev.total + 1,
            pending: prev.pending + 1
        }));
    }, [requests.length]);

    // Handle edit request
    const handleEditRequest = useCallback((formData: Omit<RepairRequest, 'id' | 'createdAt' | 'status'>) => {
        if (!editRequest) return;

        setRequests(prev => prev.map(req =>
            req.id === editRequest.id
                ? { ...req, ...formData }
                : req
        ));
        setEditRequest(null);
    }, [editRequest]);

    // Handle status update
    const handleUpdateStatus = useCallback((id: string, newStatus: string) => {
        setRequests(prev => prev.map(req => {
            if (req.id === id) {
                return {
                    ...req,
                    status: newStatus as RepairRequest['status'],
                    completedAt: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
                };
            }
            return req;
        }));

        // Update stats
        setStats(prev => {
            const updates: Partial<typeof prev> = {};

            if (newStatus === 'in-progress') {
                updates.pending = prev.pending - 1;
                updates.inProgress = prev.inProgress + 1;
            } else if (newStatus === 'completed') {
                updates.inProgress = prev.inProgress - 1;
                updates.completed = prev.completed + 1;
            }

            return { ...prev, ...updates };
        });
    }, []);

    // Handle view request
    const handleViewRequest = useCallback((request: RepairRequest) => {
        setSelectedRequest(request);
        setIsDetailModalOpen(true);
    }, []);

    // Handle edit button click
    const handleEditClick = useCallback((request: RepairRequest) => {
        setEditRequest(request);
        setIsNewRequestModalOpen(true);
    }, []);

    const value = {
        requests,
        stats,
        searchQuery,
        setSearchQuery,
        filteredRequests,
        isNewRequestModalOpen,
        setIsNewRequestModalOpen,
        selectedRequest,
        setSelectedRequest,
        isDetailModalOpen,
        setIsDetailModalOpen,
        editRequest,
        setEditRequest,
        handleNewRequest,
        handleEditRequest,
        handleUpdateStatus,
        handleViewRequest,
        handleEditClick,
    };

    return (
        <RepairRequestContext.Provider value={value}>
            {children}
        </RepairRequestContext.Provider>
    );
}
