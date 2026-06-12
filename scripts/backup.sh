#!/bin/bash
# MongoDB Nightly Backup Script

BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +"%Y%m%d")
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "Starting MongoDB backup for $DATE..."
mongodump --uri="$MONGODB_URI" --gzip --archive="$BACKUP_DIR/backup-$DATE.archive.gz"

echo "Cleaning up old backups..."
find "$BACKUP_DIR" -type f -name "backup-*.archive.gz" -mtime +$RETENTION_DAYS -exec rm {} \;

echo "Backup completed successfully."
