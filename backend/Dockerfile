FROM node:23-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Executa o migrate, push e seed
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db push && npx prisma db seed && npm run start:prod"]
