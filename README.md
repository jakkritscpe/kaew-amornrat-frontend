# Web Repair Hub (ระบบจัดการซ่อมบำรุง)

Web Repair Hub เป็นเว็บแอปพลิเคชันสำหรับผู้ดูแลระบบ (Admin) ที่ออกแบบมาเพื่อจัดการคำขอแจ้งซ่อมและทีมช่างเทคนิคโดยเฉพาะ ตัวแอปพลิเคชันมุ่งเน้นความสวยงาม ใช้งานง่าย โต้ตอบได้รวดเร็ว และมีสถาปัตยกรรมแบบ Responsive ที่รองรับทุกขนาดหน้าจอ

## ✨ ฟีเจอร์หลัก (Key Features)
- **แดชบอร์ดแบบอินเทอร์แอกทีฟ**: แสดงข้อมูลภาพรวมเชิงสถิติ (งานทั้งหมด, งานเสร็จแล้ว, กำลังดำเนินการ, รอดำเนินการ), กราฟแสดงแนวโน้มรายเดือน และสัดส่วนสถานะงาน
- **ระบบจัดการการแจ้งซ่อม (Repair Request)**: รองรับการสร้างคำขอซ่อมใหม่, เรียกดูรายละเอียด, แก้ไขข้อมูล, ค้นหา, และอัปเดตสถานะของงานย่อยต่างๆ
- **ทำเนียบช่างเทคนิค (Technicians Directory)**: สำหรับดูข้อมูลทีมช่างภายในองค์กร ภาระงานปัจจุบัน และช่องทางการติดต่อ
- **Premium UI / UX**: ใช้แอนิเมชันที่ลื่นไหล ผสานกับการออกแบบ Component ที่สวยงามและรองรับ Accessibility 
- **Responsive Layout**: เมนู Sidebar ด้านข้างสามารถย่อและปรับการแสดงผลตามขนาดหน้าจอได้อย่างไร้รอยต่อ

## 🛠️ เทคโนโลยีที่ใช้ (Technology Stack)
- **เฟรมเวิร์ก (Framework)**: React 19 + TypeScript
- **ตัวจัดการบิลด์ (Build Tool)**: Vite (รับประกันความรวดเร็วในการพัฒนา)
- **การจัดการ CSS**: Tailwind CSS, Class Variance Authority (CVA), clsx, tailwind-merge
- **UI Component พื้นฐาน**: Radix UI (Unstyled primitives ที่เน้นการเข้าถึงหรือ Accessibility)
- **ไอคอน (Icons)**: Lucide React
- **แอนิเมชัน**: GSAP (GreenSock Animation Platform) ร่วมกับ ScrollTrigger และ Tailwind Animate
- **กราฟและสถิติ (Charts)**: Recharts
- **ระบบฟอร์มและตรวจสอบข้อมูล**: React Hook Form คู่กับ Zod Resolvers
- **การจัดการวันที่**: date-fns และ react-day-picker
- **ระบบแจ้งเตือน (Notifications)**: Sonner (Toast notifications)

## 📂 โครงสร้างโปรเจกต์ (Project Structure)
```text
/app
├── public/                 # รูปภาพและไฟล์ Static พื้นฐาน 
├── src/                    # ซอร์สโค้ดหลักของแอปพลิเคชัน
│   ├── components/         # UI Components ที่ใช้ซ้ำได้ (เช่นปุ่ม, กล่องข้อความ, popup ที่สร้างจาก Radix)
│   ├── data/               # ข้อมูลตัวอย่างหรือ Mock data (ข้อมูลแจ้งซ่อม, สถิติ, รายชื่อช่าง)
│   ├── hooks/              # Custom React hooks (เช่น use-mobile ใช้เช็คขนาดหน้าจอ)
│   ├── lib/                # ไฟล์ Utilities ต่างๆ (รวมคลาส CSS เป็นต้น)
│   ├── sections/           # ส่วนประกอบหน้าจอหลัก (แดชบอร์ด, แถบเมนูด้านข้าง, แถบด้านบน, Modals)
│   ├── types/              # ไฟล์กำหนด Types/Interfaces ของ TypeScript 
│   ├── App.tsx             # Component หน้าแรกและ Router หลัก
│   ├── index.css           # สไตล์หลักระดับเจตจำนงด้วย Tailwind
│   └── main.tsx            # จุดเริ่มต้น (Entry point) ของ React 
├── package.json            # ไฟล์จัดการ dependencies และสคริปต์
├── tailwind.config.js      # ตัวกำหนดการตั้งค่าของ Tailwind CSS
├── vite.config.ts          # ตัวกำหนดการตั้งค่าของ Vite
└── .nvmrc                  # ไฟล์กำหนดเวอร์ชัน Node.js เป้าหมาย (v24)
```

## 🚀 เริ่มต้นใช้งาน (Getting Started)

### สิ่งที่ต้องการล่วงหน้า (Prerequisites)
ให้ตรวจสอบว่าในเครื่องมี Node.js เวอร์ชัน 24 แนะนำให้ใช้เครื่องมืออย่าง `nvm` (Node Version Manager) เพื่อความสะดวก

### การติดตั้งและการรันโปรเจกต์
1. Clone โปรเจกต์ และเปิดเข้าไปยังโฟลเดอร์รันโปรเจกต์
   ```bash
   cd app
   ```
2. สลับไปใช้เวอร์ชันของ Node.js ที่ถูกต้อง (24):
   ```bash
   nvm use
   ```
3. ติดตั้งแพ็กเกจที่จำเป็น (Dependencies):
   ```bash
   npm install
   ```
4. รัน Development Server:
   ```bash
   npm run dev
   ```
5. เปิดเบราว์เซอร์ แล้วเข้าไปที่ URL ដែលแสดงบน terminal (โดยปกติคือ `http://localhost:5173`)

## 📝 คำสั่งสคริปต์ที่ใช้งานบ่อย (Available Scripts)
- `npm run dev`: เริ่มต้น Local Development Server ด้วย Vite 
- `npm run build`: แปลงโค้ด TypeScript และสร้างไฟล์ Production สำหรับนำไปใช้งานจริง
- `npm run preview`: พรีวิวหน้าเว็บเหมือนอยู่บนเซิร์ฟเวอร์แบบ Production ในเครื่องของคุณเอง
- `npm run lint`: ตรวจสอบความถูกต้องและปรับรูปแบบโค้ด (Code formatting/Style checking) ด้วย ESLint
