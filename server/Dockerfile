FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies from the server workspace
COPY server/package.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

# Copy source
COPY server/ ./

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Simple HTTP healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["npm", "start"]
