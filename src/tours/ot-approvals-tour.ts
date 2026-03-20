import type { DriveStep } from 'driver.js';

export function getOTApprovalsTourSteps(): DriveStep[] {
  return [
    {
      element: '[data-tour="ot-filter-tabs"]',
      popover: {
        title: 'กรองสถานะ',
        description: 'กรองคำขอ OT ตามสถานะ — รออนุมัติ, อนุมัติแล้ว, ปฏิเสธแล้ว',
      },
    },
    {
      element: '[data-tour="ot-request-list"]',
      popover: {
        title: 'รายการคำขอ OT',
        description: 'รายการคำขอ OT พร้อมปุ่มอนุมัติ/ปฏิเสธ',
      },
    },
  ];
}
