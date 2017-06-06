### Edit these variables ###
IMG_NAME=app
PORT=3030
TAG=latest
VOLUME_TO_MOUNT=$(shell pwd)
SET_NODE_ENV=dev
### End of edit ###

IMG=sr_creation/$(IMG_NAME)
CONTAINER=$(IMG_NAME)
RUNOPTS=-p $(PORT):80
VOLUME_DESTINATION=/home/default

build:
	docker build -t $(IMG):$(TAG) --build-arg SET_NODE_ENV=$(SET_NODE_ENV) ./.

run-enter: rm
	docker run -it $(RUNOPTS) --name $(CONTAINER) -v $(VOLUME_TO_MOUNT):$(VOLUME_DESTINATION) -e ENVIRONMENT=dev $(IMG):$(TAG) /bin/bash

run-dev: rm
	docker run -d $(RUNOPTS) --name $(CONTAINER) -v $(VOLUME_TO_MOUNT):$(VOLUME_DESTINATION) -e ENVIRONMENT=dev $(IMG):$(TAG) npm run dev

run-prod: rm
	docker run -d $(RUNOPTS) --name $(CONTAINER) -e ENVIRONMENT=prod $(IMG):$(TAG) npm start

push:
	docker push $(IMG):$(TAG)

test: rm
	docker run $(RUNOPTS) --name $(CONTAINER) --rm -e ENVIRONMENT=test $(IMG):$(TAG) npm test

rm:
	docker rm -f $(CONTAINER) || true

enter:
	docker exec -it $(CONTAINER) /bin/bash