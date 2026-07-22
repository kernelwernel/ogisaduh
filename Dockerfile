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
    git \
    cmake \
    clang

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

RUN git clone --depth=1 https://github.com/NotRequiem/VMAware /tmp/vmaware && \
    cmake -B /tmp/vmaware/build -S /tmp/vmaware -DCMAKE_BUILD_TYPE=Release && \
    cmake --build /tmp/vmaware/build -- -j$(nproc) && \
    cp /tmp/vmaware/build/vmaware /usr/local/bin/vmaware && \
    rm -rf /tmp/vmaware

COPY assets ./assets
COPY topic_images ./topic_images
COPY reaction_media ./reaction_media

RUN mkdir -p data

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
