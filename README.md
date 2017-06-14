# Shardrealms App - Front-end

## Introduction

Please see the parent repository, [sr_creation](https://github.com/rhyeen/sr_creation) for more details.

## Localized Setup

To setup the app on your local machine, make sure to have `NPM` and `Node.js` installed.  You can [download it here](https://nodejs.org/en/download/).

You'll also want to install [pm2](https://www.npmjs.com/package/pm2) via npm.

Next, in the root directory of the repo, run `npm install`.

If you run into an error, something is wrong.  Depreciation warnings are expected.

## Dockerized Setup

If you wish to have the server instead run on a Docker container instead of on your local machine, you can do so.

We recommend trying to run using **Localized Setup**, just because it's easier to debug and develop.

### Pre-requisites

You must have Docker installed to run the server within a Docker container. Check the official [Docker Installation Guide](https://docs.docker.com/engine/installation/) if it isn't installed on your machine.

### Running container

To start or stop the server, build the sr-app image and run it:

```bash
make build
make run-dev
```

You should now have a server reachable at localhost:4000.

## Develop

### Running the server

You can run an instance on your local machine by first following **Setup**, entering into the app directory (`cd app`), then running `npm run dev`.  This will start the pm2 watched Node server that can be accessed via localhost:4000.

You can watch the logs of your app using `pm2 logs www`.

You can kill the app by running `pm2 kill www`, or just `pm2 kill`

## Contribute

There are two main ways to contribute: [resolve outstanding issues](https://github.com/rhyeen/sr_creation/issues) or [check the projects](https://github.com/rhyeen/sr_creation/projects) for possible tasks.  Either way, when a task is completed and ready to be merged back into the master repo branch, [create a pull request](https://github.com/rhyeen/shardrealms_app/pulls) for the core team to review and merge.

Note that issues and project tracking are done on the parent repo: [sr_creation](https://github.com/rhyeen/sr_creation)

If you plan to contribute to the tasks found in the Project list, please contact the core team at *shardrealms@gmail.com*.  We'd like to provide you with the project management tools and expertise to help your development.  We would also like to coordinate with you to ensure we work together in unison and towards the desired end result.