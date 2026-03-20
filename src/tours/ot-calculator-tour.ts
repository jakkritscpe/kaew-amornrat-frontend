import type { DriveStep } from 'driver.js';

export function getOTCalculatorTourSteps(): DriveStep[] {
  return [
    {
      element: '[data-tour="ot-period-selector"]',
      popover: {
        title: 'เลือกช่วงเวลา',
        description: 'เลือกเดือนหรือกำหนดช่วงวันที่เพื่อคำนวณค่า OT',
      },
    },
    {
      element: '[data-tour="ot-stat-cards"]',
      popover: {
        title: 'สรุปยอด OT',
        description: 'สรุปยอดค่า OT, ชั่วโมงรวม, จำนวนพนักงาน',
      },
    },
    {
      element: '[data-tour="ot-detail-table"]',
      popover: {
        title: 'รายละเอียด OT',
        description: 'รายละเอียด OT รายบุคคล พร้อมอัตราและค่าตอบแทน',
      },
    },
    {
      element: '[data-tour="ot-export-csv"]',
      popover: {
        title: 'ส่งออก CSV',
        description: 'ส่งออกข้อมูล OT เป็นไฟล์ CSV',
      },
    },
  ];
}
