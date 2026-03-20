import type { DriveStep } from 'driver.js';

export function getReportsTourSteps(): DriveStep[] {
  return [
    {
      element: '[data-tour="report-mode-toggle"]',
      popover: {
        title: 'สลับโหมด',
        description: 'สลับดูข้อมูลระหว่างมาสายและตรงเวลา',
      },
    },
    {
      element: '[data-tour="report-month-nav"]',
      popover: {
        title: 'เลือกเดือน',
        description: 'เลื่อนดูรายงานเดือนย้อนหลัง',
      },
    },
    {
      element: '[data-tour="report-monthly-table"]',
      popover: {
        title: 'ตารางรายเดือน',
        description: 'ตารางสรุปการมาสาย/ตรงเวลารายเดือน พร้อม Export CSV',
      },
    },
    {
      element: '[data-tour="report-yearly-chart"]',
      popover: {
        title: 'กราฟรายปี',
        description: 'กราฟแสดงแนวโน้มรายเดือนตลอดทั้งปี',
      },
    },
  ];
}
