#!/bin/bash

# 天下房務系統 - Supabase 資料匯入腳本
# 此腳本會將備份檔案匯入到 Supabase PostgreSQL

# 設定顏色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  天下房務系統 - Supabase 匯入工具${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# 檢查參數
if [ -z "$1" ]; then
    echo -e "${RED}❌ 請提供備份檔案名稱${NC}"
    echo ""
    echo -e "使用方式:"
    echo -e "  ./import-to-supabase.sh backup_XXXXXX.sql"
    echo ""
    echo -e "可用的備份檔案:"
    ls -1 backup_*.sql 2>/dev/null || echo "  (無備份檔案)"
    echo ""
    exit 1
fi

BACKUP_FILE=$1

# 檢查檔案是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ 找不到檔案: ${BACKUP_FILE}${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 準備匯入資料到 Supabase...${NC}"
echo -e "來源檔案: ${GREEN}${BACKUP_FILE}${NC}"
echo ""

# 請使用者輸入 Supabase 連線資訊
echo -e "${YELLOW}請輸入 Supabase 連線資訊：${NC}"
echo ""
read -p "Supabase 連線字串 (postgresql://postgres:...): " SUPABASE_URL

if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ 未提供連線字串${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  警告：此操作會清空 Supabase 資料庫現有資料並匯入備份${NC}"
read -p "確定要繼續嗎？ (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}已取消操作${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🚀 開始匯入...${NC}"

# 執行匯入
psql "$SUPABASE_URL" -f "$BACKUP_FILE"

# 檢查是否成功
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 匯入成功！${NC}"
    echo ""
    echo -e "${YELLOW}📌 建議驗證步驟：${NC}"
    echo -e "  1. 登入 Supabase Dashboard"
    echo -e "  2. 查看 Table Editor 確認資料表"
    echo -e "  3. 在 SQL Editor 執行查詢驗證資料筆數"
    echo ""
else
    echo ""
    echo -e "${RED}❌ 匯入失敗！${NC}"
    echo -e "${RED}請檢查連線字串是否正確${NC}"
    exit 1
fi
