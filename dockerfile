# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate prisma client inside the container
RUN npx prisma generate

CMD ["npm", "run", "dev"]
