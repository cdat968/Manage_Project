FROM node:22-alpine
WORKDIR /app
# deps cache layer
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
