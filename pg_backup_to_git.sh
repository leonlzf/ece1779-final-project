set -e

# === Settings ===
CONTAINER="project_db"
USER="admin"
DB="projectdb"
REPO_DIR="/root/ece1779-final-project"
BACKUP_DIR="$REPO_DIR/db_backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILE="backup_${DATE}.sql"

docker exec $CONTAINER pg_dump -U $USER -d $DB > $BACKUP_DIR/$FILE
find "$BACKUP_DIR" -type f -name "*.sql" -mtime +3 -exec rm {} \;

cd $REPO_DIR
git add "$BACKUP_DIR/$FILE"
git commit -m "auto backup at $DATE"
git push origin backup-recovery