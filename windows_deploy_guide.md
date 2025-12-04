# คู่มือการติดตั้งและรันโปรเจกต์บน Windows 11 (Background Mode)

เอกสารนี้จะแนะนำวิธีการนำโปรเจกต์ SugarcaneBillRecordingSystem ไปรันบนเครื่อง Windows 11 โดยให้ทำงานอยู่เบื้องหลัง (Background) โดยไม่ต้องเปิด IDE ทิ้งไว้

## 1. สิ่งที่ต้องเตรียม (Prerequisites)

ก่อนเริ่มติดตั้ง ตรวจสอบให้แน่ใจว่าเครื่อง Windows ปลายทางได้ติดตั้งโปรแกรมเหล่านี้แล้ว:

1.  **Node.js**: (เวอร์ชัน 18 หรือ 20 LTS)
    *   ดาวน์โหลด: [https://nodejs.org/](https://nodejs.org/)
2.  **MongoDB**: (Database)
    *   ดาวน์โหลด: [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
    *   **สำคัญ**: ตอนติดตั้ง ให้เลือก "Install MongoD as a Service" (ปกติจะถูกเลือกไว้อยู่แล้ว) เพื่อให้ฐานข้อมูลรันอัตโนมัติเมื่อเปิดเครื่อง
3.  **Git** (ถ้าต้องการ clone โค้ดลงเครื่อง): [https://git-scm.com/](https://git-scm.com/)

---

## 2. วิธีการติดตั้งและรัน (Easy Setup)

ผมได้เตรียมไฟล์ Script ไว้ให้แล้ว เพื่อให้คุณสามารถติดตั้งและรันได้ง่ายๆ เพียงแค่คลิกเดียว

### ขั้นตอน:

1.  นำโฟลเดอร์โปรเจกต์นี้ไปไว้ที่เครื่อง Windows (เช่น `C:\SugarcaneSystem`)
2.  เข้าไปในโฟลเดอร์โปรเจกต์
3.  ดับเบิ้ลคลิกไฟล์ **`setup_and_run.bat`**
4.  รอจนกว่าหน้าต่างสีดำจะทำงานเสร็จและขึ้นข้อความว่า "Application is running!"

**สิ่งที่ Script นี้จะทำให้:**
*   ติดตั้ง `pm2` (โปรแกรมจัดการ Process)
*   ติดตั้ง dependencies ทั้งของ Server และ Client
*   Build หน้าเว็บ (Frontend) ให้เป็นไฟล์พร้อมใช้งาน
*   เริ่มการทำงานของระบบทั้งหมดในโหมดเบื้องหลัง (Background)

---

## 3. การใช้งานและการจัดการ

เมื่อรันเสร็จแล้ว ระบบจะทำงานอยู่ที่:
*   **URL**: `http://localhost:5001` (เข้าผ่าน Browser ได้เลย)

### คำสั่งจัดการ (ผ่านไฟล์ .bat ที่เตรียมไว้)

*   **หยุดการทำงาน**: ดับเบิ้ลคลิก `stop_app.bat`
*   **เริ่มการทำงานใหม่ (ถ้าหยุดไป)**: ดับเบิ้ลคลิก `setup_and_run.bat` อีกครั้ง

### การจัดการขั้นสูง (ผ่าน PowerShell หรือ CMD)

หากต้องการดูสถานะหรือจัดการละเอียดกว่านี้ ให้เปิด PowerShell แล้วใช้คำสั่ง:

*   `pm2 list` : ดูรายการแอพที่รันอยู่
*   `pm2 monit` : ดูหน้าจอ Monitor (CPU/Memory/Logs)
*   `pm2 logs` : ดู Logs การทำงาน
*   `pm2 restart sugarcane-system` : รีสตาร์ทระบบ

---

## 4. ทำให้รันอัตโนมัติเมื่อเปิดเครื่อง (Auto-Startup)

หากต้องการให้โปรแกรมรันขึ้นมาเองทันทีที่เปิดเครื่อง Windows (โดยไม่ต้อง login ก็ได้):

1.  เปิด **PowerShell** ในฐานะ **Administrator** (คลิกขวาที่ปุ่ม Start -> Terminal (Admin) หรือ PowerShell (Admin))
2.  พิมพ์คำสั่งต่อไปนี้:
    ```powershell
    npm install -g pm2-windows-startup
    pm2-startup install
    pm2 save
    ```
3.  เสร็จสิ้น! ตอนนี้โปรแกรมจะรันเองทุกครั้งที่รีสตาร์ทเครื่อง

---

## 5. การแก้ไขปัญหาเบื้องต้น (Troubleshooting)

*   **เข้าเว็บไม่ได้**:
    *   ตรวจสอบว่า MongoDB รันอยู่หรือไม่ (เช็คใน Services ของ Windows)
    *   ลองพิมพ์ `pm2 logs` เพื่อดูว่ามี Error อะไรแจ้งเตือนหรือไม่
*   **Port ชน (EADDRINUSE)**:
    *   ตรวจสอบว่ามีโปรแกรมอื่นใช้ Port 5001 อยู่หรือไม่ หรือลองเปลี่ยน Port ใน `ecosystem.config.js` และ `server/src/index.ts`

---

## โครงสร้างการทำงาน (Technical Details)

*   **Backend**: รันด้วย Node.js ผ่าน PM2
*   **Frontend**: ถูก Build เป็น Static Files และให้บริการ (Serve) ผ่าน Backend โดยตรง (Port 5001) ทำให้ไม่ต้องรัน 2 Process แยกกัน ช่วยประหยัดทรัพยากรและจัดการง่ายขึ้น
