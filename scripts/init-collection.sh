#!/usr/bin/env bash
set -e

mongo <<EOF
use $DB
db.createUser({
  user:  '$USER',
  pwd: '$PSW',
  roles: [{
    role: 'readWrite',
    db: '$DB'
  }]
})
db.cursach_bd.createIndex({ pressure:"hashed"})
sh.enableSharding('$DB')
sh.shardCollection( "$DB.cursach_bd", { pressure:"hashed" })
EOF
