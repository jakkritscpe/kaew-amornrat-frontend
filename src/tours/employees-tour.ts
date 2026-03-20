import type { DriveStep } from 'driver.js';

export function getEmployeesTourSteps(): DriveStep[] {
  return [
    {
      element: '[data-tour="employee-search"]',
      popover: {
        title: 'ค้นหาพนักงาน',
        description: 'ค้นหาพนักงานด้วยชื่อ ชื่อเล่น หรือแผนก',
      },
    },
    {
      element: '[data-tour="add-employee"]',
      popover: {
        title: 'เพิ่มพนักงาน',
        description: 'กดเพื่อเพิ่มพนักงานใหม่เข้าระบบ',
      },
    },
    {
      element: '[data-tour="employee-card"]',
      popover: {
        title: 'การ์ดพนักงาน',
        description: 'การ์ดพนักงาน — ดูข้อมูล กะงาน แผนก สถานะเช็คอิน',
      },
    },
    {
      element: '[data-tour="qr-button"]',
      popover: {
        title: 'QR Code ลงเวลา',
        description: 'กดเพื่อแสดง QR Code สำหรับลงเวลาของพนักงาน',
      },
    },
  ];
}
