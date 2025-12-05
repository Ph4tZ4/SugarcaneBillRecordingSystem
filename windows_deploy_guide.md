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

*   **เจอปัญหา SecurityError / PSSecurityException (สีแดงๆ)**:
    *   เกิดจาก Windows บล็อกการรัน Script
    *   วิธีแก้: เปิด PowerShell แล้วพิมพ์คำสั่ง: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
*   **เข้าเว็บไม่ได้**:
    *   ตรวจสอบว่า MongoDB รันอยู่หรือไม่ (เช็คใน Services ของ Windows)
    *   ลองพิมพ์ `pm2 logs` เพื่อดูว่ามี Error อะไรแจ้งเตือนหรือไม่
*   **Port ชน (EADDRINUSE)**:
    *   ตรวจสอบว่ามีโปรแกรมอื่นใช้ Port 5001 อยู่หรือไม่ หรือลองเปลี่ยน Port ใน `ecosystem.config.js` และ `server/src/index.ts`

---

## โครงสร้างการทำงาน (Technical Details)

*   **Backend**: รันด้วย Node.js ผ่าน PM2
*   **Frontend**: ถูก Build เป็น Static Files และให้บริการ (Serve) ผ่าน Backend โดยตรง (Port 5001) ทำให้ไม่ต้องรัน 2 Process แยกกัน ช่วยประหยัดทรัพยากรและจัดการง่ายขึ้น

---

## 6. การเข้าใช้งานจากเครื่องอื่น (Network Access)

หากต้องการให้เครื่องอื่นในวงแลน (LAN) เดียวกัน หรือเปิดผ่านมือถือ สามารถเข้าใช้งานได้ ทำตามนี้:

### 1. ดู IP Address ของเครื่องนี้
1.  เปิด **PowerShell** หรือ **CMD**
2.  พิมพ์คำสั่ง `ipconfig`
3.  ดูที่หัวข้อ **IPv4 Address** (เช่น `192.168.1.105`)

### 2. ตั้งค่า Firewall (สำคัญ)
ต้องอนุญาตให้ Port 5001 ผ่าน Firewall ได้:
1.  กดปุ่ม Start พิมพ์ "Firewall" เลือก **Windows Defender Firewall with Advanced Security**
2.  เลือก **Inbound Rules** (ซ้ายมือ) -> **New Rule...** (ขวามือ)
3.  เลือก **Port** -> Next
4.  เลือก **TCP** และช่อง Specific local ports พิมพ์ `5001` -> Next
5.  เลือก **Allow the connection** -> Next
6.  ติ๊กถูกทั้ง Domain, Private, Public -> Next
7.  ตั้งชื่อว่า `Sugarcane App` -> Finish

### 3. การเข้าใช้งาน
*   ไปที่เครื่องอื่น หรือมือถือ (ที่ต่อ WiFi เดียวกัน)
*   เปิด Browser พิมพ์ `http://<IP-ของเครื่องนี้>:5001`
    *   ตัวอย่าง: `http://192.168.1.105:5001`

### 4. การตั้ง IP ให้คงที่ (Static IP) - *แนะนำ*
เพื่อให้ IP ไม่เปลี่ยนทุกครั้งที่เปิดเครื่องใหม่ (ทำให้ไม่ต้องคอยเช็ค IP ใหม่ตลอด):
1.  กดปุ่ม Start พิมพ์ "View network connections"
2.  คลิกขวาที่ Network ที่ใช้อยู่ (Wi-Fi หรือ Ethernet) -> **Properties**
3.  เลือก **Internet Protocol Version 4 (TCP/IPv4)** -> **Properties**
4.  เลือก **Use the following IP address**
5.  กรอก IP ที่ต้องการ (อิงจากเลขเดิม แต่เปลี่ยนเลขท้ายให้จำง่าย เช่น `.200`)
    *   **IP address**: `192.168.1.200` (ตัวอย่าง)
    *   **Subnet mask**: `255.255.255.0` (ปกติจะขึ้นเอง)
    *   **Default gateway**: (ดูจากค่า Default Gateway ในคำสั่ง `ipconfig`)
6.  ช่อง DNS ข้างล่าง ใส่ `8.8.8.8` และ `8.8.4.4` (Google DNS)
7.  กด OK
8.  ต่อไปนี้เข้าผ่าน `http://192.168.1.200:5001` ได้ตลอดเลย

---

## 7. การเข้าใช้งานด้วยชื่อเครื่อง (DNS / Hostname)

ถ้าไม่อยากจำเลข IP (เช่น `192.168.1.xxx`) คุณสามารถใช้ **ชื่อเครื่องคอมพิวเตอร์** แทนได้เลย

### 1. ดูชื่อเครื่อง (Computer Name)
1.  เปิด **PowerShell** หรือ **CMD**
2.  พิมพ์คำสั่ง `hostname`
3.  ชื่อที่แสดงออกมาคือชื่อเครื่องของคุณ (สมมติว่าชื่อ `acer`)

### 2. การเข้าใช้งาน
*   **Windows / Android (ส่วนใหญ่)**:
    *   พิมพ์ `http://<ชื่อเครื่อง>:5001`
    *   ตัวอย่าง: `http://acer:5001`
*   **iPhone / iPad / Mac (Apple Devices)**:
    *   ต้องเติม `.local` ต่อท้ายชื่อเครื่อง
    *   พิมพ์ `http://<ชื่อเครื่อง>.local:5001`
    *   ตัวอย่าง: `http://acer.local:5001`

### 3. การเปลี่ยนชื่อเครื่องให้จำง่าย (Optional)
ถ้าชื่อเครื่องปัจจุบันยาวหรือจำยาก (เช่น `DESKTOP-8J2K3L`) สามารถเปลี่ยนได้:
1.  กดปุ่ม Start พิมพ์ "Rename your PC"
2.  กดปุ่ม **Rename this PC**
3.  ตั้งชื่อใหม่ที่ต้องการ (เช่น `sugarcane-server`)
4.  กด Next และ **Restart** เครื่อง 1 ครั้ง
5.  หลังจากนั้นก็เข้าผ่าน `http://sugarcane-server:5001` ได้เลย
