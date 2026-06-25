#!/bin/sh
exec unshare --mount -- sh -c 'mount -t tmpfs tmpfs /run/secrets && exec sh -c "$1"' sh "$1"
