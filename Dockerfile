FROM node:20-alpine

RUN apk add --no-cache \
    build-base \
    python3 \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    procps \
    curl \
    wget \
    vim \
    htop \
    net-tools \
    iproute2 \
    gcompat \
    libstdc++ \
    shadow \
    sudo

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

COPY assets ./assets
COPY vmaware /usr/local/bin/vmaware
COPY topic_images ./topic_images
COPY reaction_media ./reaction_media

RUN mkdir -p data

RUN printf 'nobody ALL=(root) NOPASSWD: /sbin/apk\n' > /etc/sudoers.d/nobody-apk && \
    chmod 440 /etc/sudoers.d/nobody-apk && \
    printf '#!/bin/sh\nif [ "$(id -u)" = "0" ]; then exec /sbin/apk "$@"; else exec sudo /sbin/apk "$@"; fi\n' > /usr/local/bin/apk && \
    chmod +x /usr/local/bin/apk

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
