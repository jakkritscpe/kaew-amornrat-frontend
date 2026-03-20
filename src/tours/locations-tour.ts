import type { DriveStep } from 'driver.js';

export function getLocationsTourSteps(): DriveStep[] {
  return [
    {
      element: '[data-tour="add-location"]',
      popover: {
        title: 'เพิ่มสถานที่',
        description: 'เพิ่มสถานที่ทำงานใหม่ กำหนดพิกัด GPS และรัศมี',
      },
    },
    {
      element: '[data-tour="location-list"]',
      popover: {
        title: 'รายการสถานที่',
        description: 'รายการสถานที่ทำงาน พร้อมพิกัดและรัศมี Geofence',
      },
    },
    {
      element: '[data-tour="location-map"]',
      popover: {
        title: 'แผนที่สถานที่ทำงาน',
        description: 'แผนที่แสดงตำแหน่งสถานที่ทำงานทั้งหมด',
        side: 'left',
      },
    },
  ];
}
