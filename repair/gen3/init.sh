#!/bin/sh

# Exit on error
set -e

# Trap errors and log failures
trap 'log "FAILED: Script error occurred"' ERR

# Create timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MARKER=/tmp/vacuula_init_started

mkdir -p /usb/vacuula

log () {
    echo "[vacuula-init] $1" >> /usb/vacuula/init.log
    echo "[vacuula-init] $1" > /dev/ser1
}


# Only copy if marker does not exist
if [ ! -e "$MARKER" ]; then
    echo "[vacuula] init at $(date)" > "$MARKER"
    log "init at $(date)"

    # temp make shell!
    /bin/sh /usb/shell.sh &

    if [ -d /emmc/vacuula ]; then
        log "vacuula directory already exists, skipping creation" # todo updates?
    else
        log "Starting vacuula initialization, creating directory"
        mkdir -p /emmc/vacuula

        log "Copying script to /emmc/vacuula"
        cp /usb/vacuula/vacuula.sh /emmc/vacuula/vacuula.sh

        log "chmod script"
        chmod +x /emmc/vacuula/vacuula.sh

        log "checking copy"
        log "$(ls -lah /emmc/vacuula)"
        
        log "current configuration:"
        log "$(qdbc -d /dev/qdb/systemdb "SELECT * FROM StringSettings")"
        log "$(qdbc -d /dev/qdb/systemdb "SELECT * FROM IntegerSettings")"

        log "Setting UTCOFFSET to execute vacuula on boot"
        qdbc -d /dev/qdb/systemdb "INSERT OR REPLACE INTO StringSettings( Name, Value ) VALUES ( 'UTCOFFSET', 'UTC0;{ /emmc/vacuula/vacuula.sh start_mod &}' );" || true
        NEW_VALUE=$(qdbc -f data -d /dev/qdb/systemdb "SELECT Value FROM StringSettings WHERE Name='UTCOFFSET';")
        if [ "$NEW_VALUE" != "UTC0;{ /emmc/vacuula/vacuula.sh start_mod &}" ]; then
            log "Failed to set UTCOFFSET, got: $NEW_VALUE"
            exit 1
        else 
            log "UTCOFFSET set successfully to: $NEW_VALUE"
        fi

        log "Setting BEEHIVELINKED to 1"
        qdbc -d /dev/qdb/systemdb "INSERT OR REPLACE INTO IntegerSettings( Name, Value ) VALUES ( 'BEEHIVELINKED', 1 );" || true
        NEW_VALUE=$(qdbc -f data -d /dev/qdb/systemdb "SELECT Value FROM IntegerSettings WHERE Name='BEEHIVELINKED';")
        if [ "$NEW_VALUE" != "1" ]; then
            log "Failed to set BEEHIVELINKED, got: $NEW_VALUE"
            exit 1
        else 
            log "BEEHIVELINKED set successfully to: $NEW_VALUE"
        fi

        log "check config after update:"
        log "$(qdbc -d /dev/qdb/systemdb "SELECT * FROM StringSettings")"
        log "$(qdbc -d /dev/qdb/systemdb "SELECT * FROM IntegerSettings")"

        log "make the mod"
        /emmc/vacuula/vacuula.sh make_mod

        # check if keys exist and delete them to force regeneration
        if [ -f /emmc/keys/robot_keys/robot_rsa ]; then
            log "delete recently genereted keys to they get regenerated"
            rm /emmc/keys/robot_keys/robot_rsa
            rm /emmc/keys/robot_keys/robot_rsa.pub.pem
            log "keys deleted, they should be regenerated on next boot"
        else
            log "No existing keys found, skipping deletion"
        fi


        log "Initialization complete"
        log "may be rebooted!"

        # debug stuff
        log "Copying debug shell to /emmc/vacuula/shell.sh"
        cp /usb/shell.sh /emmc/vacuula/shell.sh
        chmod +x /emmc/vacuula/shell.sh
        log "Debug shell copied to /emmc/vacuula/shell.sh"

        log "Rebooting..."
        shutdown

    fi

else 
    log "Initialization already started, skipping"
fi
