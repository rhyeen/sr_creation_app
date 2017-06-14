FROM node:6

# for make run-enter only
RUN npm install pm2 -g

ADD ./app /app
ADD ./private-serve /private-serve
ADD ./run_dev.sh /

RUN cd /app; \
    npm install

CMD ["npm", "run", "start"]