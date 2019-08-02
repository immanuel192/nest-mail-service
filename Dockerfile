FROM mhart/alpine-node:latest
ENV NODE_ENV production

RUN mkdir -p /var/app/current
WORKDIR /var/app/current
COPY package.json /var/app/current
COPY . /var/app/current
RUN npm install
RUN npm run dist:build
RUN rm -rf /var/app/current/src
EXPOSE 9000

CMD npm run start
