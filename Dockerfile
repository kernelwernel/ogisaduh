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
    ttf-freefont \
    fontconfig \
    git

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

COPY assets ./assets
COPY topic_images ./topic_images
COPY reaction_media ./reaction_media

RUN mkdir -p data

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
