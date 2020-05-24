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
db.mlab_cursach_bd_cities.createIndex({ name:"hashed"})
sh.enableSharding('$DB')
sh.shardCollection( "$DB.mlab_cursach_bd_cities", { name:"hashed" })
EOF
