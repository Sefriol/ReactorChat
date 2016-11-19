#!/bin/bash

set -m

cmd="mongod --httpinterface --rest --master"
$cmd &

if [ ! -f /data/db/.mongodb_password_set ]; then
    /bin/bash config_mongo.sh
fi

fg