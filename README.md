# Workly - Ứng Dụng Quản Lý Ca Làm Việc Cá Nhân

Workly là một ứng dụng React Native được thiết kế để giúp người lao động quản lý ca làm việc cá nhân một cách hiệu quả và linh hoạt.

## 🌟 Tính Năng Chính

### 📱 Giao Diện Trực Quan
- **Nút Đa Năng**: Thực hiện đầy đủ quy trình chấm công (Đi Làm → Check-in → Check-out → Hoàn Tất)
- **Chế độ Đơn Giản**: Chỉ hiển thị nút "Đi Làm" cho người dùng cơ bản
- **Lưới Trạng Thái Tuần**: Xem tổng quan trạng thái làm việc 7 ngày
- **Widget Thời Tiết**: Hiển thị thông tin thời tiết và cảnh báo

### ⏰ Quản Lý Ca Làm Việc
- Tạo và quản lý nhiều ca làm việc khác nhau
- Hỗ trợ ca qua đêm với logic tính toán chính xác
- Tự động xoay ca theo cấu hình (hàng tuần/2 tuần/tháng)
- Nhắc nhở thông minh cho từng mốc thời gian

### 📊 Chấm Công & Thống Kê
- Chấm công tự động với timestamp chính xác
- Tính toán giờ làm việc theo lịch trình
- Phân loại giờ: Giờ HC, OT, Chủ Nhật, Đêm
- Thống kê chi tiết theo ngày/tuần/tháng

### 🔔 Nhắc Nhở Thông Minh
- Báo thức đáng tin cậy (vượt qua chế độ im lặng)
- Nhắc nhở đi làm, chấm công vào/ra
- Quản lý ghi chú với nhắc nhở tùy chỉnh
- Cảnh báo thời tiết cực đoan

### 🌤️ Cảnh Báo Thời Tiết
- Tự động xác định vị trí nhà và công ty
- Cảnh báo thời tiết cực đoan (mưa, nóng, lạnh, bão)
- Tối ưu hóa API miễn phí với cache thông minh
- Dự báo 3 giờ tới

### 💾 Lưu Trữ An Toàn
- Lưu trữ cục bộ với AsyncStorage
- Hoạt động offline hoàn toàn
- Sao lưu và phục hồi dữ liệu
- Bảo mật thông tin cá nhân

## 🚀 Cài Đặt và Chạy

### Yêu Cầu Hệ Thống
- Node.js 18+
- npm hoặc yarn
- Expo CLI
- Android Studio (cho Android) hoặc Xcode (cho iOS)

### Cài Đặt Dependencies
```bash
npm install
```

### Chạy Ứng Dụng
```bash
# Chạy trên Expo Go
npm start

# Chạy trên Android
npm run android

# Chạy trên iOS
npm run ios

# Chạy trên Web
npm run web
```

## 🔧 Cấu Hình

### API Thời Tiết
1. Đăng ký tài khoản miễn phí tại [OpenWeatherMap](https://openweathermap.org/api)
2. Lấy API key
3. Cập nhật `WEATHER_API_KEY` trong `src/services/weather.ts`

### Quyền Ứng Dụng
Ứng dụng yêu cầu các quyền sau:
- **Vị trí**: Xác định vị trí nhà/công ty cho cảnh báo thời tiết
- **Thông báo**: Gửi nhắc nhở và báo thức
- **Rung**: Phản hồi haptic khi bấm nút

### ⚠️ Lưu Ý Về Notifications
Từ Expo SDK 53+, **push notifications** đã bị loại bỏ khỏi Expo Go trên Android:

- ✅ **Local notifications** hoạt động bình thường trong Expo Go
- ❌ **Push notifications** cần development build trên Android
- ✅ **iOS Expo Go** vẫn hỗ trợ đầy đủ

**Khuyến nghị**: Sử dụng development build để có đầy đủ tính năng.
Xem [NOTIFICATION-SETUP-GUIDE.md](./NOTIFICATION-SETUP-GUIDE.md) để biết chi tiết.

## 📱 Hướng Dẫn Sử Dụng

### Lần Đầu Sử Dụng
1. Mở ứng dụng và cho phép các quyền cần thiết
2. Tạo ca làm việc đầu tiên trong **Cài Đặt > Quản Lý Ca**
3. Chọn ca làm việc hiện tại
4. Bắt đầu sử dụng nút đa năng để chấm công

### Quy Trình Chấm Công
1. **Đi Làm**: Bấm khi chuẩn bị đi làm (xác định vị trí nhà)
2. **Chấm Công Vào**: Bấm khi đến nơi làm việc (xác định vị trí công ty)
3. **Ký Công**: Bấm nếu ca yêu cầu (tùy chọn)
4. **Chấm Công Ra**: Bấm khi kết thúc giờ làm
5. **Hoàn Tất**: Bấm khi hoàn thành ca làm việc

### Quản Lý Ghi Chú
- Tạo ghi chú với tiêu đề và nội dung
- Đặt mức độ ưu tiên (⭐)
- Thiết lập nhắc nhở theo thời gian cụ thể
- Liên kết với ca làm việc

## 🏗️ Kiến Trúc Ứng Dụng

```
src/
├── components/          # Các component UI tái sử dụng
├── screens/            # Các màn hình chính
├── services/           # Logic nghiệp vụ và API
├── contexts/           # React Context cho state management
├── types/              # TypeScript type definitions
├── constants/          # Constants và themes
└── utils/              # Utility functions
```

### Công Nghệ Sử Dụng
- **React Native**: Framework chính
- **Expo**: Platform phát triển
- **TypeScript**: Type safety
- **React Navigation**: Điều hướng
- **React Native Paper**: UI components
- **AsyncStorage**: Lưu trữ cục bộ
- **Expo Location**: Dịch vụ vị trí
- **Expo Notifications**: Thông báo và báo thức
- **date-fns**: Xử lý thời gian

## 🤝 Đóng Góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## 📞 Hỗ Trợ

Nếu bạn gặp vấn đề hoặc có câu hỏi:
- Tạo issue trên GitHub
- Email: support@workly.app
- Telegram: @workly_support

## 🔮 Roadmap

### Phiên Bản Tiếp Theo
- [ ] Xuất báo cáo Excel/PDF
- [ ] Đồng bộ đám mây
- [ ] Widget màn hình chính
- [ ] Tích hợp lịch hệ thống
- [ ] Chế độ làm việc nhóm
- [ ] Tính lương tự động

### Tính Năng Nâng Cao
- [ ] Machine Learning dự đoán ca làm việc
- [ ] Tích hợp với hệ thống HR
- [ ] API cho ứng dụng bên thứ ba
- [ ] Phân tích hiệu suất làm việc

---

**Workly** - Quản lý ca làm việc thông minh, đơn giản và hiệu quả! 🚀
# workly
