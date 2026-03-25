import { useCallback } from 'react';
import type { WorkLocation } from '../types';
import { createLocationApi, updateLocationApi, deleteLocationApi } from '../../../lib/api/locations-api';

export function useLocationActions(onSuccess: () => Promise<void>) {
  const addLocation = useCallback(async (loc: Omit<WorkLocation, 'id'>) => {
    await createLocationApi(loc);
    await onSuccess();
  }, [onSuccess]);

  const updateLocation = useCallback(async (id: string, updates: Partial<WorkLocation>) => {
    await updateLocationApi(id, updates);
    await onSuccess();
  }, [onSuccess]);

  const removeLocation = useCallback(async (id: string) => {
    await deleteLocationApi(id);
    await onSuccess();
  }, [onSuccess]);

  return { addLocation, updateLocation, removeLocation };
}
