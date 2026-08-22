#!/bin/sh
chmod 600 /run/secrets/discord_token 2>/dev/null || true
chmod 600 /run/secrets/database_url 2>/dev/null || true
chmod 600 /run/secrets/deepseek_api_key 2>/dev/null || true
exec node dist/index.js
