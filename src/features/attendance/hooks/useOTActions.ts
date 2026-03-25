import { useCallback } from 'react';
import type { OTRequest } from '../types';
import { submitOTRequestApi, updateOTStatusApi } from '../../../lib/api/ot-api';

export function useOTActions(onSuccess: () => Promise<void>) {
  const submitOTRequest = useCallback(async (req: Omit<OTRequest, 'id' | 'status'>) => {
    await submitOTRequestApi({ date: req.date, startTime: req.startTime, endTime: req.endTime, reason: req.reason });
    await onSuccess();
  }, [onSuccess]);

  const updateOTStatus = useCallback(async (id: string, status: OTRequest['status']) => {
    if (status === 'pending') return;
    await updateOTStatusApi(id, status);
    await onSuccess();
  }, [onSuccess]);

  return { submitOTRequest, updateOTStatus };
}
