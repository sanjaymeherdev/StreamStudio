FROM alpine:3.20

ARG MEDIAMTX_VERSION=v1.19.1

RUN apk add --no-cache wget tar ca-certificates && \
    wget -O /tmp/mediamtx.tar.gz \
      https://github.com/bluenviron/mediamtx/releases/download/${MEDIAMTX_VERSION}/mediamtx_${MEDIAMTX_VERSION}_linux_amd64.tar.gz && \
    tar -xzf /tmp/mediamtx.tar.gz -C /usr/local/bin mediamtx && \
    rm /tmp/mediamtx.tar.gz && \
    apk del wget tar

COPY mediamtx.yml /mediamtx.yml

# Render injects $PORT for the HTTP service (HLS).
# RTMP stays on 1935 but Render's free/web service plan
# only exposes ONE public port (the HTTP one) by default.
EXPOSE 1935 8888

CMD sh -c "sed -i \"s/:8888/:\${PORT:-8888}/\" /mediamtx.yml && exec /usr/local/bin/mediamtx /mediamtx.yml"
