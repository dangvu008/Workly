# 🚀 Hướng Dẫn Setup Development Build

Development Build là giải pháp tốt nhất để test ứng dụng Workly với đầy đủ tính năng, thay thế cho Expo Go có nhiều hạn chế.

## 🎯 Tại Sao Cần Development Build?

### ❌ Hạn Chế của Expo Go
- **Bundle size lớn**: 2174+ modules, load rất chậm (168+ giây)
- **Thiếu tính năng**: Không hỗ trợ notifications, audio services
- **Performance kém**: Chạy chậm, lag, crash thường xuyên
- **Debugging khó**: Không có full access đến native APIs

### ✅ Ưu Điểm của Development Build
- **Performance tốt**: Chạy như production app
- **Đầy đủ tính năng**: Notifications, audio, background services
- **Debugging tốt**: Full access, hot reload, debugging tools
- **Stable**: Ít crash, performance ổn định

## 🛠️ Cách Setup Development Build

### Bước 1: Cài Đặt EAS CLI
```bash
npm install -g @expo/eas-cli
eas login
```

### Bước 2: Cấu Hình EAS Build
```bash
eas build:configure
```

### Bước 3: Build Development Build
```bash
# Build cho Android (khuyến nghị)
eas build --profile development --platform android

# Build cho iOS (cần Apple Developer Account)
eas build --profile development --platform ios
```

### Bước 4: Cài Đặt Development Build
- **Android**: Download APK từ Expo dashboard và cài đặt
- **iOS**: Cài qua TestFlight hoặc direct install

### Bước 5: Chạy Development Server
```bash
# Chuyển về phiên bản đầy đủ
npm run switch:normal

# Start development server
npx expo start --dev-client
```

## 🏗️ Build Local với Android Studio (Khuyến Nghị)

### Yêu Cầu
- Android Studio với Android SDK
- Java Development Kit (JDK) 11+
- Android device hoặc emulator

### Các Bước
```bash
# 1. Tạo development build local
npx expo run:android

# 2. Hoặc build APK để cài đặt
npx expo build:android --type apk
```

## ⚡ Tối Ưu Hóa Cho Expo Go (Tạm Thời)

Nếu vẫn muốn dùng Expo Go trong lúc chờ setup Development Build:

```bash
# Chuyển sang phiên bản tối ưu cho Expo Go
npm run start:expo-go
```

### Tính Năng Bị Disable Trên Expo Go:
- ❌ Weather service
- ❌ Audio/Alarm services  
- ❌ Heavy animations
- ❌ Some background services

### Tính Năng Vẫn Hoạt Động:
- ✅ **Auto mode (nút đa năng tự động)** - Hoạt động bình thường
- ✅ Core functionality
- ✅ Shift management
- ✅ Notes and statistics
- ✅ All UI components

## 🔄 Chuyển Đổi Giữa Các Phiên Bản

```bash
# Chuyển sang phiên bản Expo Go (tối ưu)
npm run switch:expo-go
npm start

# Chuyển về phiên bản đầy đủ
npm run switch:normal
npm start

# Hoặc dùng development build
npx expo start --dev-client
```

## 🎯 Khuyến Nghị

1. **Cho Development**: Dùng Development Build với Android Studio
2. **Cho Testing Nhanh**: Dùng phiên bản Expo Go tối ưu
3. **Cho Production**: Build standalone app

## 🆘 Troubleshooting

### Expo Go Load Chậm
```bash
# Clear cache và restart
npx expo start --clear --tunnel
```

### Development Build Không Connect
```bash
# Đảm bảo cùng network
npx expo start --dev-client --tunnel
```

### Build Lỗi
```bash
# Clear cache
npx expo install --fix
eas build --clear-cache
```
