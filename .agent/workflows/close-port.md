---
description: 如何關閉佔用的 Port
---

# 關閉佔用的 Port 教程

## 方法一：查找並終止特定 Port 的進程

### 1. 查看哪個進程佔用了該 Port

```bash
# 查看 3001 port（後端）
lsof -i :3001

# 查看 5173 port（前端 Vite）
lsof -i :5173
```

輸出範例：
```
COMMAND   PID   USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    12345   leo   23u  IPv6 0x1234567890abcdef      0t0  TCP *:3001 (LISTEN)
```

其中 `PID` 就是進程 ID（例如：12345）

### 2. 使用 PID 終止進程

```bash
# 優雅地終止進程（推薦）
kill 12345

# 強制終止進程（如果上面的指令無效）
kill -9 12345
```

### 3. 一行指令完成（快速方法）

```bash
# 自動查找並終止佔用 3001 port 的進程
lsof -ti:3001 | xargs kill -9

# 自動查找並終止佔用 5173 port 的進程
lsof -ti:5173 | xargs kill -9
```

## 方法二：使用 pkill 終止特定程式

```bash
# 終止所有 node 進程（注意：會終止所有 Node.js 程式）
pkill node

# 終止所有 npm 進程
pkill npm
```

## 方法三：在終端機中使用快捷鍵

如果你的服務是在終端機中直接運行的：

1. 切換到該終端機視窗
2. 按 `Ctrl + C` 終止進程

## 查看所有監聽的 Port

```bash
# 查看所有正在監聽的 port
lsof -i -P | grep LISTEN

# 只查看 node 相關的
lsof -i -P | grep LISTEN | grep node
```

## 常用 Port

本專案使用的 port：
- **3001**: 後端 API Server
- **5173**: 前端 Vite Dev Server

## 故障排除

### 如果 lsof 指令無效

可以嘗試使用 netstat：

```bash
netstat -vanp tcp | grep 3001
```

### 如果進程無法終止

嘗試使用 sudo（需要管理員權限）：

```bash
sudo kill -9 12345
```

或：

```bash
sudo lsof -ti:3001 | xargs sudo kill -9
```

## 預防措施

1. **正常關閉服務**：盡量使用 `Ctrl + C` 而不是直接關閉終端機
2. **檢查 Port**：啟動服務前先檢查 port 是否已被佔用
3. **使用腳本**：可以建立啟動腳本自動檢查並清理 port

## 自動化腳本範例

建立一個 `start-clean.sh` 腳本：

```bash
#!/bin/bash

# 清理可能佔用的 port
echo "清理 port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null

echo "清理 port 5173..."
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "Port 已清理完成"
echo "啟動後端服務..."
cd backend && npm start
```

使用方式：
```bash
chmod +x start-clean.sh
./start-clean.sh
```
