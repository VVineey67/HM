FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

# Railway sets PORT automatically — do not hardcode
CMD ["node", "server.js"]
