import type { DriveStep } from 'driver.js';

export function getSettingsTourSteps(): DriveStep[] {
  return [
    {
      element: '[data-tour="settings-tabs"]',
      popover: {
        title: 'แท็บตั้งค่า',
        description: 'สลับระหว่าง สิทธิ์การเข้าถึง, บัญชีผู้ดูแล, ค่าตอบแทน OT',
      },
    },
    {
      element: '[data-tour="settings-rbac"]',
      popover: {
        title: 'สิทธิ์การเข้าถึง (RBAC)',
        description: 'กำหนดเมนูที่แต่ละ Admin เข้าถึงได้',
      },
    },
    {
      element: '[data-tour="settings-accounts"]',
      popover: {
        title: 'บัญชีผู้ดูแล',
        description: 'จัดการบัญชี Admin และ Manager',
      },
    },
  ];
}
