import type { DriveStep } from 'driver.js';

export function getDashboardTourSteps(): DriveStep[] {
  return [
    {
      popover: {
        title: 'ยินดีต้อนรับ! 👋',
        description: 'นี่คือแดชบอร์ดภาพรวมการลงเวลาประจำวัน',
      },
    },
    {
      element: '[data-tour="stat-cards"]',
      popover: {
        title: 'สถิติวันนี้',
        description: 'ดูสถิติการมาทำงานวันนี้ — มาทำงาน, มาสาย, ขาดงาน, รออนุมัติ OT',
      },
    },
    {
      element: '[data-tour="recent-checkins"]',
      popover: {
        title: 'เช็คอินล่าสุด',
        description: 'ตารางเช็คอินล่าสุด ดูการเข้า-ออกงานของพนักงานวันนี้',
      },
    },
    {
      element: '[data-tour="theme-toggle"]',
      popover: {
        title: 'สลับธีม',
        description: 'กดเพื่อสลับธีมสว่าง/มืด',
        side: 'bottom',
      },
    },
  ];
}
