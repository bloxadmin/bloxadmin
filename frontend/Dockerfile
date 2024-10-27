FROM node:20

WORKDIR /app

COPY package.json ./

RUN yarn

COPY . .

RUN yarn build

EXPOSE 3000

CMD ["npx", "serve", "-s", "dist", "-l", "3000"]
