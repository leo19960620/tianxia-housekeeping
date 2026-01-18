#!/bin/bash

# 天下房務系統 - 資料庫匯出腳本
# 此腳本會匯出本地 PostgreSQL 資料庫的完整資料

# 設定顏色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  天下房務系統 - 資料庫匯出工具${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# 取得當前時間作為檔案名稱
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"

echo -e "${YELLOW}📦 開始匯出資料庫...${NC}"
echo -e "目標檔案: ${GREEN}${BACKUP_FILE}${NC}"
echo ""

# 從 .env 讀取資料庫設定（如果存在）
if [ -f "../.env" ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
fi

# 設定預設值
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-root}
DB_NAME=${DB_NAME:-housekeeping}

echo -e "資料庫資訊:"
echo -e "  Host: ${DB_HOST}"
echo -e "  Port: ${DB_PORT}"
echo -e "  User: ${DB_USER}"
echo -e "  Database: ${DB_NAME}"
echo ""

# 執行匯出
pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} \
  --no-owner --no-acl --clean --if-exists \
  -f ${BACKUP_FILE}

# 檢查是否成功
if [ $? -eq 0 ]; then
    FILE_SIZE=$(ls -lh ${BACKUP_FILE} | awk '{print $5}')
    echo ""
    echo -e "${GREEN}✅ 匯出成功！${NC}"
    echo -e "檔案: ${GREEN}${BACKUP_FILE}${NC}"
    echo -e "大小: ${GREEN}${FILE_SIZE}${NC}"
    echo ""
    echo -e "${YELLOW}📌 請保存此檔案，稍後將用於匯入到 Supabase${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ 匯出失敗！${NC}"
    echo -e "${RED}請確認：${NC}"
    echo -e "  1. PostgreSQL 已安裝 pg_dump 工具"
    echo -e "  2. 資料庫連線資訊正確"
    echo -e "  3. 資料庫服務正在運行"
    echo ""
    exit 1
fi
