FROM node:24-alpine
WORKDIR /app
COPY package.json /app/
RUN npm install
COPY server.js /app/
COPY public/index.html /app/public/
CMD ["npm", "start"]
