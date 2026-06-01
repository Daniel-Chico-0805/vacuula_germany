#!/bin/sh
set -e

VACUULA_VERSION=000001
TARGET_NEATO_VERSION=4.5.3-189

NEATO_VERSION=$(cat /var/app_data/sw_info.txt)
OPERATION=${1}
LOGGER="logger -t ${0}"
FOLDER=/emmc/vacuula/${VACUULA_VERSION}
MODDED_ASTRO=${FOLDER}/astro_mod
ASTRO=/usr/bin/astro
LOCK_FILE=/tmp/vacuula_lock_$$

log () {
    ${LOGGER} "[vacuula] $1"
    echo "[vacuula] $1" > /dev/ser1
}

run_once () {
    set -C  # Enable noclobber - prevents overwriting files
    
    # Try to create lock file atomically - only succeeds if it doesn't exist
    if echo $$ > /tmp/vacuula_lock 2>/dev/null; then
        log "Acquired lock with PID $$"
        set +C  # Disable noclobber
        return 0
    else
        log "Lock already held, exiting"
        set +C  # Disable noclobber
        exit 0
    fi
}

case "${NEATO_VERSION}" in
    4.5.3-189)
        # Replace nucleo path (446448 == 0x6CFF0)
        NUCLEO_OFFSET=446448
        # Replace beehive path (446484 == 0x6D014)
        BEEHIVE_OFFSET=446484
        # Replace cloudmock path (446520 == 0x6D038)
        CLOUDMOCK_OFFSET=446520
        ;;
    *)
        log "Neato version ${NEATO_VERSION} is not supported, exiting"
        exit 1
esac



watchdog () {
    original_pid=$(pidin -f aN | awk '$NF ~ /astro$/ { print $1 }')
    modded_pid=$(pidin -f aN | awk '$NF ~ /astro_mod$/ { print $1 }')

    if [ -n "$original_pid" ]; then
        log "Original astro is running with PID ${original_pid}, killing it"
        slay ${original_pid}
        crontab -r
    fi

    if [ -n "$modded_pid" ]; then
        log "Modded astro is running with PID ${modded_pid}, nothing to do"
    else
        log "Modded astro is not running, starting it"
        ${MODDED_ASTRO} &
        modded_pid=$!
        log "Started modded astro with PID ${modded_pid}"
    fi
}



make_mod () {
    log "Making modded astro binary at ${MODDED_ASTRO}"
    log "Copying original astro from ${ASTRO}"
    mkdir -p ${FOLDER}
    cp ${ASTRO} ${MODDED_ASTRO}

    # For testing use your own self signed ca
    log "Copying certificate files to ${FOLDER}"
    cp /usb/vacuula/cert.pem ${FOLDER}/vacuulaaa.crt
    cp /usb/vacuula/cert.pem ${FOLDER}/vacuulaaaa.crt
    cp /usb/vacuula/cert.pem ${FOLDER}/vacuulaaaaaa.crt

    # build the strings that should be replaced in modded astro
    log "Building replacement strings for modded astro"
    # /var/server/neato_cloud/Nucleo.crt
    # /emmc/vacuula/XXXXXX/vacuulaaa.crt
    echo -n "${FOLDER}/vacuulaaa.crt" > ${FOLDER}/nucleo_path
    # /var/server/neato_cloud/Beehive.crt
    # /emmc/vacuula/XXXXXX/vacuulaaaa.crt
    echo -n "${FOLDER}/vacuulaaaa.crt" > ${FOLDER}/beehive_path
    # /var/server/neato_cloud/CloudMock.crt
    # /emmc/vacuula/XXXXXX/vacuulaaaaaa.crt
    echo -n "${FOLDER}/vacuulaaaaaa.crt" > ${FOLDER}/cloudmock_path

    log "Replacing certificate paths in modded astro binary"
    dd if=${FOLDER}/nucleo_path of=${MODDED_ASTRO} bs=1 seek=${NUCLEO_OFFSET} conv=notrunc
    dd if=${FOLDER}/beehive_path of=${MODDED_ASTRO} bs=1 seek=${BEEHIVE_OFFSET} conv=notrunc
    dd if=${FOLDER}/cloudmock_path of=${MODDED_ASTRO} bs=1 seek=${CLOUDMOCK_OFFSET} conv=notrunc

    log "Modded astro binary created successfully"
    log "$(ls -lah ${FOLDER})"
}


start_mod () {
    watchdog
    # temp make shell!
    /bin/sh /emmc/vacuula/shell.sh &

    # start cron
    # echo "*/3 * * * * ${FOLDER}/vacuula.sh watchdog" | crontab -
}


case "${OPERATION}" in
    watchdog)
        log "Watchdog called - making sure vacuula is active"
		watchdog
        ;;
    make_mod)
        run_once
        make_mod
        ;;
    start_mod)
        run_once
        start_mod
esac






