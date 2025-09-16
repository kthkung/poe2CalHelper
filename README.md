# 💰 POE2 Currency Calculator

เว็บแอปพลิเคชันสำหรับคำนวณการแบ่ง Currency เมื่อไปฟาร์มใน Path of Exile 2 แบบปาร์ตี้ สูงสุด 6 คน พร้อมระบบดึงราคาล่าสุดจาก POE2Scout API

## 🌐 Live Demo
**[🚀 ใช้งานได้ที่: https://kthkung.github.io/poe2CalHelper/](https://kthkung.github.io/poe2CalHelper/)**

## ✨ ฟีเจอร์

- 🎮 **คำนวณแบ่ง Currency** ตาม Contribution ของแต่ละคน
- 💰 **รองรับ 2 Currency หลัก**: Divine Orbs และ Exalted Orbs (เน้น Divine เป็นหลัก)
- 🔄 **Auto-update ราคา** จาก POE2Scout API แบบ Real-time
- ⚙️ **Manual Override** สามารถแก้ไขราคาได้หากไม่ตรงกับตลาด
- 👥 **รองรับ 2-6 คน** ในปาร์ตี้
- ⚖️ **แบ่งเท่ากัน** ด้วยปุ่มเดียว
- 📱 **Responsive Design** ใช้งานได้ทั้ง Mobile และ Desktop
- 💾 **Auto-save** บันทึกข้อมูลอัตโนมัติ
- 📋 **คัดลอกผลลัพธ์** พร้อม Exchange Rates และ League info
- 💎 **แสดงมูลค่าใน Exalted Orbs** เป็นหลัก (ตาม API)
- 🏆 **League Support**: Rise of the Abyssal
- 🔄 **Multi-Round System**: รองรับการฟาร์มหลายรอบแยกข้อมูลกัน

## 🎯 ฟีเจอร์ใหม่ล่าสุด
- 📷 **Upload รูปภาพ**: แชร์ไอเท็มที่ขายได้และหลักฐานการแบ่ง
- ✅ **Player Confirmation**: ติดตามสถานะการรับส่วนแบ่งของแต่ละคน
- 🗂️ **Round Management**: จัดการรอบการฟาร์มแยกตามสมาชิกที่เข้าร่วม

## ✨ ฟีเจอร์

- 🎮 **คำนวณแบ่ง Currency** ตาม Contribution ของแต่ละคน
- � **รองรับ 2 Currency หลัก**: Divine Orbs และ Exalted Orbs
- 🔄 **Auto-update ราคา** จาก POE2Scout API
- ⚙️ **Manual Override** สามารถแก้ไขราคาได้หากไม่ตรงกับตลาด
- �👥 **รองรับ 2-6 คน** ในปาร์ตี้
- ⚖️ **แบ่งเท่ากัน** ด้วยปุ่มเดียว
- 📱 **Responsive Design** ใช้งานได้ทั้ง Mobile และ Desktop
- 💾 **Auto-save** บันทึกข้อมูลอัตโนมัติ
- 📋 **คัดลอกผลลัพธ์** พร้อม Exchange Rates
- 💱 **แสดงมูลค่าใน Chaos Orbs** สำหรับการแลกเปลี่ยน

## 🚀 วิธี Deploy บน GitHub Pages

### 1. สร้าง Repository บน GitHub
```bash
# สร้าง repository ใหม่บน GitHub (ผ่านเว็บไซต์)
# หรือใช้ GitHub CLI
gh repo create poe2-currency-calculator --public
```

### 2. อัปโหลดไฟล์
```bash
# เข้าไปในโฟลเดอร์โปรเจค
cd currency-calculator

# Initialize Git (ถ้ายังไม่ได้ทำ)
git init

# เพิ่มไฟล์ทั้งหมด
git add .

# Commit
git commit -m "🎉 Initial commit: POE2 Currency Calculator with API integration"

# เชื่อมต่อกับ GitHub
git remote add origin https://github.com/YOUR_USERNAME/poe2-currency-calculator.git

# Push ขึ้น GitHub
git push -u origin main
```

### 3. เปิด GitHub Pages
1. ไปที่ Repository บน GitHub
2. คลิก **Settings** (แท็บด้านบน)
3. เลื่อนลงไปหา **Pages** (เมนูซ้าย)
4. ในส่วน **Source** เลือก **Deploy from a branch**
5. เลือก **main** branch และ **/ (root)**
6. คลิก **Save**

### 4. เข้าใช้งาน
หลังจากตั้งค่าแล้ว 2-3 นาที จะสามารถเข้าใช้งานได้ที่:
```
https://YOUR_USERNAME.github.io/poe2-currency-calculator/
```

## 🎯 วิธีใช้งาน

1. **เลือก Currency หลัก** (Divine หรือ Exalted Orbs)
2. **กรอกจำนวน Currency** ที่ได้จากการฟาร์ม
3. **ระบบจะดึงราคาล่าสุด** จาก POE2Scout API อัตโนมัติ
4. **แก้ไขราคาได้** หากไม่ตรงกับตลาดปัจจุบัน
5. **เพิ่ม/ลบสมาชิก** ในปาร์ตี้ (2-6 คน)
6. **กรอก Contribution %** ของแต่ละคน
7. **ดูผลการคำนวณ** พร้อมมูลค่าในหลาย Currency
8. **คัดลอกผลลัพธ์** เพื่อแชร์ให้เพื่อน

### 💡 ฟีเจอร์พิเศษ
- **API Status**: แสดงสถานะการโหลดราคาจาก API
- **Rate Source Indicator**: แสดงว่าราคามาจาก API หรือแก้ไขด้วยตนเอง
- **Multi-Currency Display**: แสดงผลลัพธ์ในหลาย Currency พร้อมกัน
- **Exchange Rate Info**: ระบุอัตราแลกเปลี่ยนที่ใช้ในการคำนวณ

### ⌨️ Keyboard Shortcuts
- `Ctrl/Cmd + E` - แบ่งเท่ากัน
- `Ctrl/Cmd + Enter` - คำนวณใหม่
- `Ctrl/Cmd + R` - เคลียร์ข้อมูล

## 🛠️ เทคโนโลยีที่ใช้

- **HTML5** - โครงสร้างเว็บไซต์
- **CSS3** - การออกแบบและ Responsive Design
- **Vanilla JavaScript** - ตรรกะการคำนวณและ API Integration
- **POE2Scout API** - ข้อมูลราคา Currency แบบ Real-time
- **LocalStorage** - บันทึกข้อมูลและ Manual Override

## 📱 ตัวอย่างการใช้งาน

```
Currency: 10 🔮 Divine Orbs
Exchange Rate: 1 Divine = 185 Chaos (จาก API)

Player 1 (คุณ): 40% = 4.0 Divine (≈ 740 Chaos)
Player 2 (เพื่อน): 30% = 3.0 Divine (≈ 555 Chaos)  
Player 3 (เพื่อน2): 30% = 3.0 Divine (≈ 555 Chaos)
```

## 🔧 การพัฒนาเพิ่มเติม

หากต้องการแก้ไขหรือเพิ่มฟีเจอร์:

1. **Clone repository**
```bash
git clone https://github.com/YOUR_USERNAME/poe2-currency-calculator.git
cd poe2-currency-calculator
```

2. **แก้ไขไฟล์**
- `index.html` - โครงสร้าง HTML
- `style.css` - การออกแบบ
- `script.js` - ตรรกะการทำงานและ API Integration

3. **Push การเปลี่ยนแปลง**
```bash
git add .
git commit -m "✨ เพิ่มฟีเจอร์ใหม่"
git push
```

## � API Integration

เว็บไซต์นี้ใช้ **POE2Scout API** เพื่อดึงราคา Currency ล่าสุด:
- ✅ อัตโนมัติ refresh ราคาเมื่อโหลดหน้าเว็บ
- ✅ สามารถ manual refresh ได้ด้วยปุ่ม "อัปเดตราคา"
- ✅ Fallback ไปใช้ราคาเริ่มต้นหาก API ไม่ตอบสนอง
- ✅ แสดงสถานะการโหลด API
- ✅ ระบบ Manual Override สำหรับการแก้ไขราคา

## 💎 เหมาะสำหรับ

- **Path of Exile 2** - Currency farming แบบปาร์ตี้
- **Divine Orbs & Exalted Orbs** - Currency หลักในเกม
- **Real-time Market Prices** - ราคาที่เปลี่ยนแปลงตลอดเวลา
- **Party Farming Groups** - กลุมที่ต้องการแบ่ง loot อย่างยุติธรรม

## 📄 License

MIT License - ใช้งานฟรี แก้ไขได้ แชร์ได้

## 🤝 Contributing

ยินดีรับ Pull Request และ Issues สำหรับการปรับปรุงเว็บไซต์!

## 🔗 Credits

- **POE2Scout**: สำหรับ API ข้อมูลราคา Currency
- **Path of Exile 2**: เกมที่เราทุกคนรัก

---

**Happy Farming in POE2!** 🎮💎🔮