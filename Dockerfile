FROM node:18-alpine

WORKDIR /app

# The project uses no external npm dependencies, so there is no package.json.
# We copy the server code and public assets directly.
COPY server.js .
COPY public/ public/

# Cloud Run injects the PORT environment variable (typically 8080)
EXPOSE 8080
ENV PORT=8080

CMD ["node", "server.js"]
