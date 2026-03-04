import { createContext, useContext, type ReactNode } from 'react';
import { useJobs } from '../hooks/useJobs';
import type { JobForm } from '../hooks/useJobs';

export interface JobsContextValue {
    jobs: JobForm[];
    addJob: (data: Omit<JobForm, 'id' | 'createdAt'>) => JobForm;
    getJobById: (id: string) => JobForm | undefined;
}

// eslint-disable-next-line react-refresh/only-export-components
export const JobsContext = createContext<JobsContextValue | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
    const { jobs, addJob } = useJobs();
    const getJobById = (id: string) => jobs.find(j => j.id === id);
    return (
        <JobsContext.Provider value={{ jobs, addJob, getJobById }}>
            {children}
        </JobsContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useJobsContext() {
    const ctx = useContext(JobsContext);
    if (!ctx) throw new Error('useJobsContext must be used within JobsProvider');
    return ctx;
}

