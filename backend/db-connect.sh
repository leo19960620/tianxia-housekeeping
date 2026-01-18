#!/bin/bash

# 載入 .env 設定
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# 連接到 PostgreSQL
echo "📦 連接到資料庫: ${DB_NAME}"
echo "👤 使用者: ${DB_USER}"
echo "🌐 主機: ${DB_HOST}:${DB_PORT}"
echo ""
echo "提示：輸入密碼後即可進入 SQL 命令列"
echo ""

psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME}
