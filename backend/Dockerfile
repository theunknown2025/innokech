# PocketBase Dockerfile for Render deployment
FROM alpine:3.19

# Install curl for downloading PocketBase
RUN apk add --no-cache curl unzip

# PocketBase version (match your local setup)
ARG PB_VERSION=0.36.5
WORKDIR /app

# Download and extract PocketBase
RUN curl -L -o pocketbase.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" && \
    unzip pocketbase.zip && \
    rm pocketbase.zip && \
    chmod +x pocketbase

# Copy migrations (schema) - pb_data is created at runtime
COPY pb_migrations ./pb_migrations

# Expose default PocketBase port
EXPOSE 8090

# Render provides PORT env; default to 8090 for local Docker runs
# Bind to 0.0.0.0 so Render can reach it
CMD sh -c './pocketbase serve --http=0.0.0.0:${PORT:-8090}'
