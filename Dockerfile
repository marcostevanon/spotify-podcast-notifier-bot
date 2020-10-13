FROM node:lts-alpine
WORKDIR /usr
ADD ./package.json .
RUN npm install
COPY . .
RUN npm run build
ADD .env .
ENTRYPOINT ["node", "build/index.js"]
