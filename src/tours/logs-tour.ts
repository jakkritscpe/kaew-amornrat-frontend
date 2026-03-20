import type { DriveStep } from 'driver.js';

export function getLogsTourSteps(): DriveStep[] {
  return [
    {
      element: '[data-tour="logs-filter"]',
      popover: {
        title: 'ค้นหาและกรอง',
        description: 'ค้นหาและกรองข้อมูลตามชื่อ แผนก หรือวันที่',
      },
    },
    {
      element: '[data-tour="logs-export"]',
      popover: {
        title: 'ส่งออก CSV',
        description: 'ส่งออกข้อมูลการลงเวลาเป็นไฟล์ CSV',
      },
    },
    {
      element: '[data-tour="logs-table"]',
      popover: {
        title: 'ตารางประวัติ',
        description: 'ตารางประวัติการลงเวลา — ดูเวลาเข้า-ออก, ชั่วโมงทำงาน, สถานะ',
      },
    },
  ];
}
