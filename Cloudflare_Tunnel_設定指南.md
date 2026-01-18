# Cloudflare Tunnel 完整設定指南

## 📍 目前狀態
- ✅ PostgreSQL資料庫已建立
- ✅ 後端API伺服器程式碼完成
- ✅ React Native App已建立
- ✅ Cloudflare Tunnel已安裝並啟動
- ⏳ 需要取得公開URL並完成測試

---

## 🚀 第一步:取得Cloudflare Tunnel公開URL

### 方法A: 使用Quick Tunnel (推薦,最簡單)

1. **確認後端伺服器正在運行**
   
   開啟**第一個終端機視窗**:
   ```bash
   cd /Users/leo/tianxia-housekeeping/backend
   npm run dev
   ```
   
   保持這個視窗運行,應該看到:
   ```
   🚀 伺服器已啟動
   📍 http://localhost:3000
   ```

2. **啟動Quick Tunnel**
   
   開啟**第二個終端機視窗**:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
   
   **請等待幾秒鐘**,您會看到類似這樣的訊息:
   ```
   |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):
   |  https://xxxxx-xxxxx-xxxxx.trycloudflare.com
   ```

3. **複製URL**
   
   複製那個 `https://xxxxx.trycloudflare.com` 的URL
   
   **⚠️ 重要**: 
   - ✅ 複製 `https://xxxxx.trycloudflare.com`
   - ❌ 不要複製 `https://xxxxx.trycloudflare.com/api`

---

## 🔧 第二步:更新React Native App的API設定

取得URL後,請告訴我,格式如下:
```
我的URL是: https://xxxxx.trycloudflare.com
```

我會幫您更新App的配置!

---

## 🧪 第三步:測試API連線

取得URL後,我們會進行測試:

1. **測試健康檢查**
   ```bash
   curl https://您的URL/health
   ```
   
   應該看到:
   ```json
   {
     "status": "ok",
     "message": "服務中心交接系統 API 運行中"
   }
   ```

2. **測試登入API**
   ```bash
   curl -X POST https://您的URL/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```
   
   應該看到包含token的回應

---

## 📱 第四步:啟動React Native App

1. **啟動Metro Bundler**
   
   開啟**第三個終端機視窗**:
   ```bash
   cd /Users/leo/tianxia-housekeeping/TianxiaHousekeeping
   npm start -- --reset-cache
   ```

2. **執行Android App**
   
   開啟**第四個終端機視窗**:
   ```bash
   cd /Users/leo/tianxia-housekeeping/TianxiaHousekeeping
   npm run android
   ```

3. **在模擬器中測試登入**
   - 帳號: `admin`
   - 密碼: `admin123`

---

## ✅ 成功標準

1. ✅ 後端伺服器在localhost:3000運行
2. ✅ Cloudflare Tunnel提供公開URL
3. ✅ 從外網可以訪問API
4. ✅ Android App可以登入並顯示資料

---

## 🐛 常見問題

### Q1: Tunnel顯示"connection timeout"
**解決**: 檢查後端伺服器是否正在運行

### Q2: API回應404
**解決**: 確認URL是 `https://xxx.trycloudflare.com/api/auth/login` (有/api)

### Q3: App無法連線
**解決**: 檢查 `src/config/constants.js` 中的BASE_URL是否正確

---

## 📞 下一步

**請現在執行第一步**,取得Cloudflare Tunnel的URL後告訴我,格式:
```
我的URL是: https://xxxxx.trycloudflare.com
```

我會立即幫您完成後續設定!
