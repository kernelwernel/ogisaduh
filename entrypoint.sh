#!/bin/sh
chmod 600 /run/secrets/discord_token 2>/dev/null || true
exec node dist/index.js
