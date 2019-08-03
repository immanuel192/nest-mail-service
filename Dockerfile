FROM mhart/alpine-node:latest

RUN mkdir -p /var/app/current/src
WORKDIR /var/app/current
COPY *.json /var/app/current/
COPY src/. /var/app/current/src/
RUN rm /var/app/current/src/conf/local.json
RUN npm install
RUN npm run dist:build
RUN rm -rf /var/app/current/src
ENV NODE_ENV production
EXPOSE 9000

CMD npm run start
