import { useCallback } from 'react';
import type { Employee } from '../types';
import { createEmployeeApi, updateEmployeeApi, deleteEmployeeApi } from '../../../lib/api/employees-api';

export function useEmployeeActions(onSuccess: () => Promise<void>) {
  const addEmployee = useCallback(async (emp: Omit<Employee, 'id'> & { password: string }) => {
    await createEmployeeApi(emp);
    await onSuccess();
  }, [onSuccess]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee> & { password?: string }) => {
    await updateEmployeeApi(id, updates);
    await onSuccess();
  }, [onSuccess]);

  const removeEmployee = useCallback(async (id: string) => {
    await deleteEmployeeApi(id);
    await onSuccess();
  }, [onSuccess]);

  return { addEmployee, updateEmployee, removeEmployee };
}
