set -e

CONTAINER=project_db
USER=admin
DB=projectdb
REPO_DIR=rootece1779-final-projectdb_backups

FILE=$1

if [ -z $FILE ]; then
  echo Usage pg_restore_from_git.sh backup-file.sql
  exit 1
fi

# Pull latest backups from GitHub
cd rootece1779-final-project
git pull origin backup-recovery

# Restore database
docker exec -i $CONTAINER psql -U $USER -d $DB  $REPO_DIR$FILE