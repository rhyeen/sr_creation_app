FROM node:6

ADD . /app

RUN cd /app; \
    npm install

CMD ["npm", "run", "start"]