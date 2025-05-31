# Mockup Chi Tiết: Lưới Trạng Thái Tuần trên HomeScreen

## Tổng Quan
Lưới Trạng Thái Tuần là một component quan trọng trên HomeScreen, hiển thị trạng thái làm việc của 7 ngày trong tuần hiện tại. Người dùng có thể tương tác trực tiếp để cập nhật trạng thái thủ công.

---

## Giao Diện Lưới Trạng Thái Tuần

### Mockup Cơ Bản
```
┌─────────────────────────────────────────────────────────────┐
│                    Trạng thái tuần này                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ T2  │ │ T3  │ │ T4  │ │ T5  │ │ T6  │ │*T7* │ │ CN  │  │
│  │ 26  │ │ 27  │ │ 28  │ │ 29  │ │ 30  │ │*31* │ │ 01  │  │
│  │ ✅  │ │ ✅  │ │ 🏖️  │ │ ⚠️  │ │ ✅  │ │*❓* │ │ ❓  │  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Ví Dụ Chi Tiết với Các Trạng Thái Khác Nhau
```
┌─────────────────────────────────────────────────────────────┐
│                    Trạng thái tuần này                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ T2  │ │ T3  │ │ T4  │ │ T5  │ │ T6  │ │*T7* │ │ CN  │  │
│  │ 26  │ │ 27  │ │ 28  │ │ 29  │ │ 30  │ │*31* │ │ 01  │  │
│  │ ✅  │ │ ❗  │ │ 🏖️  │ │ ⚠️  │ │ 🛌  │ │*❓* │ │ ❓  │  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  │
│                                                             │
│  Hoàn   Thiếu   Nghỉ   Ra/Vào  Nghỉ   Hôm    Tương        │
│  thành  log     phép   không   bệnh   nay    lai          │
│                        chuẩn                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Cấu Trúc Từng Ô Ngày

### Thành Phần Của Mỗi Ô
```
┌─────┐
│ T7  │  ← Tên thứ (viết tắt, bản địa hóa)
│ 31  │  ← Số ngày trong tháng
│ ❓  │  ← Icon trạng thái (màu sắc tương ứng)
└─────┘
```

### Trạng Thái Ngày Hiện Tại
```
┌─────┐
│*T7* │  ← Tên thứ in đậm, có dấu *
│*31* │  ← Số ngày in đậm, có dấu *
│*❓* │  ← Icon có viền hoặc nền nổi bật
└─────┘
```

---

## Bảng Icon Trạng Thái

| Trạng Thái | Icon | Màu Sắc | Mô Tả |
|------------|------|---------|-------|
| **Hoàn thành** | ✅ | #4CAF50 (Xanh lá) | Đủ công, làm việc đầy đủ |
| **Đi muộn** | ❗ | #FF9800 (Cam) | Check-in muộn hơn quy định |
| **Về sớm** | ⏰ | #2196F3 (Xanh dương) | Check-out sớm hơn quy định |
| **Đi muộn & Về sớm** | ⚠️ | #FF5722 (Đỏ cam) | Cả hai lỗi trên |
| **Vắng mặt** | ❌ | #F44336 (Đỏ) | Không có mặt, không báo trước |
| **Nghỉ phép** | 🏖️ | #9C27B0 (Tím) | Nghỉ phép có lương |
| **Nghỉ bệnh** | 🛌 | #607D8B (Xám xanh) | Nghỉ ốm, bệnh tật |
| **Nghỉ lễ** | 🎉 | #E91E63 (Hồng) | Nghỉ lễ, tết |
| **Công tác** | ✈️ | #00BCD4 (Xanh ngọc) | Đi công tác |
| **Thiếu log** | ❗ | #FF9800 (Cam) | Thiếu dữ liệu chấm công |
| **Chưa xác định** | ❓ | #9E9E9E (Xám) | Chưa có dữ liệu hoặc ngày tương lai |

---

## Tương Tác Người Dùng

### 1. Nhấn Vào Ô Ngày (Tap)
```
Người dùng nhấn vào ô ngày
         ↓
Hệ thống xác định loại ngày (quá khứ/hiện tại/tương lai)
         ↓
Mở Modal Cập nhật Trạng thái với các tùy chọn phù hợp
         ↓
Người dùng chọn hành động
         ↓
Cập nhật dữ liệu và làm mới giao diện
```

### 2. Nhấn Giữ Ô Ngày (Long Press) - Legacy
```
Người dùng nhấn giữ ô ngày (500ms)
         ↓
Hiển thị Menu ngữ cảnh với các tùy chọn nhanh
         ↓
Người dùng chọn trạng thái
         ↓
Cập nhật ngay lập tức
```

---

## Responsive Design

### Trên Điện Thoại (Portrait)
```
┌─────────────────────────────────────────┐
│        Trạng thái tuần này              │
├─────────────────────────────────────────┤
│                                         │
│ ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐   │
│ │T2 ││T3 ││T4 ││T5 ││T6 ││T7 ││CN │   │
│ │26 ││27 ││28 ││29 ││30 ││31 ││01 │   │
│ │✅ ││✅ ││🏖️ ││⚠️ ││✅ ││❓ ││❓ │   │
│ └───┘└───┘└───┘└───┘└───┘└───┘└───┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Trên Tablet (Landscape)
```
┌─────────────────────────────────────────────────────────────┐
│                    Trạng thái tuần này                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ T2  │ │ T3  │ │ T4  │ │ T5  │ │ T6  │ │ T7  │ │ CN  │  │
│  │ 26  │ │ 27  │ │ 28  │ │ 29  │ │ 30  │ │ 31  │ │ 01  │  │
│  │ ✅  │ │ ✅  │ │ 🏖️  │ │ ⚠️  │ │ ✅  │ │ ❓  │ │ ❓  │  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Animation và Hiệu Ứng

### 1. Slide Up Animation
- **Delay**: 500ms sau khi HomeScreen load
- **Duration**: 300ms
- **Easing**: ease-out

### 2. Tap Feedback
- **Ripple effect**: Khi nhấn vào ô ngày
- **Scale animation**: Nhẹ nhàng phóng to 1.05x khi nhấn

### 3. Status Update Animation
- **Fade out**: Icon cũ mờ dần (200ms)
- **Fade in**: Icon mới hiện dần (200ms)
- **Color transition**: Màu nền chuyển đổi mượt mà

---

## Accessibility Features

### 1. Screen Reader Support
- **Semantic labels**: "Thứ Bảy, ngày 31 tháng 5, trạng thái chưa xác định"
- **Action hints**: "Nhấn để cập nhật trạng thái"

### 2. Keyboard Navigation
- **Tab order**: Từ trái qua phải, T2 → CN
- **Enter/Space**: Mở modal cập nhật

### 3. High Contrast Mode
- **Border**: Thêm viền rõ ràng cho các ô
- **Text**: Tăng độ tương phản chữ

---

## Tích Hợp với Hệ Thống

### 1. Data Source
- **weeklyStatus**: Object chứa trạng thái từng ngày
- **activeShift**: Ca làm việc hiện tại
- **userSettings**: Cài đặt người dùng (ngôn ngữ, ngày đầu tuần)

### 2. Real-time Updates
- **Auto refresh**: Khi có thay đổi từ Multi-Function Button
- **Manual refresh**: Pull-to-refresh trên HomeScreen
- **Background sync**: Cập nhật khi app trở lại foreground

### 3. Performance Optimization
- **Memoization**: React.memo cho component
- **Lazy loading**: Chỉ render khi cần thiết
- **Efficient re-renders**: Chỉ update ô thay đổi
