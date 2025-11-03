FROM node

RUN mkdir -p /proofhub

WORKDIR /proofhub

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]
