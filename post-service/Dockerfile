# Use the official node.js 18 image with alpine linux as the base image

FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3002

CMD [ "node","src/index.js" ]