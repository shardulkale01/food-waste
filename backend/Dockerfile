FROM node:18-slim

WORKDIR /app

# Install dependencies first (for caching)
COPY package*.json ./
RUN npm install --production

# Copy local code to the container image.
COPY . .

# Match the port Cloud Run uses
ENV PORT=8080
EXPOSE 8080

# Run the web service on container startup.
CMD [ "node", "server.js" ]
