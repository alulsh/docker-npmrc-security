# Docker images and .npmrc security

This is a companion repo to a blog post I'm writing about Docker images and `.npmrc` security. I'll update this README once I publish the blog post.

## Setup

To build these example Docker images you'll need git, Node.js, npm, an npm account, and Docker. You'll need to set an `NPM_TOKEN` environment variable so you can pass it as a build argument to Docker.

### Clone the repo

1. `git clone https://github.com/alulsh/docker-npmrc-security.git` or `git clone git@github.com:alulsh/docker-npmrc-security.git`
1. `cd docker-npmrc-security`

### Npm

1. Install Node.js and npm. I recommend using [nvm](https://github.com/creationix/nvm).
1. [Sign up](https://www.npmjs.com/signup) for an account on npmjs.com.
1. Run `npm token create --read-only` to create a [read-only npm token](https://docs.npmjs.com/getting-started/working_with_tokens#how-to-create-a-new-read-only-token).
1. Run `export NPM_TOKEN=<npm token>` to set your npm token as an environment variable.

### Docker

[Download the version of Docker CE](https://docs.docker.com/install/) for your operating system.

## Insecure Dockerfiles

### #1 - Leaving `.npmrc` files in Docker containers

[`Dockerfile-insecure-1`](https://github.com/alulsh/docker-npmrc-security/blob/master/Dockerfile-insecure-1)

To build this image, run `docker build . -f Dockerfile-insecure-1 -t insecure-app-1 --build-arg NPM_TOKEN=$NPM_TOKEN`.

#### Problem

```
ARG NPM_TOKEN

RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
RUN npm install
```

The `.npmrc` file is never deleted from this image. The `.npmrc` file is on the file system of any containers created from this image.

#### Exploitation

1. Run `docker run -it insecure-app-1 ash` to start the container. We need to use `ash` instead of `bash` since we're running Alpine Linux.
1. Run `ls -al`. You should see an `.npmrc` file in the `/private-app` directory.
1. Run `cat .npmrc`.

### #2 - Leaving .npmrc files in Docker intermediate images

[`Dockerfile-insecure-2`](https://github.com/alulsh/docker-npmrc-security/blob/master/Dockerfile-insecure-2)

To build this image, run `docker build . -f Dockerfile-insecure-2 -t insecure-app-2 --build-arg NPM_TOKEN=$NPM_TOKEN`.

#### Problem

```
ARG NPM_TOKEN

RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
RUN npm install
RUN rm -f .npmrc
```

The `.npmrc` file is deleted from this Docker image but in a separate `RUN` instruction. Each `RUN` instruction creates a new Docker layer (intermediate image). If an attacker has access to the Docker daemon or obtains a copy of our image then they can steal the `.npmrc` file from the layers of the Docker image.

#### Exploitation

1. Run `docker save insecure-app-2 -o ~/insecure-app-2.tar` to save the Docker image as a tarball.
1. Run `mkdir ~/insecure-app-2 && tar xf ~/insecure-app-2.tar -C ~/insecure-app-2` to untar to `~/insecure-app-2`.
1. Run `cd ~/insecure-app-2`.
1. Run `for layer in */layer.tar; do tar -tf $layer | grep -w .npmrc && echo $layer; done`. You should see a list of layers with `.npmrc` files.
1. Run `tar xf <layer id>/layer.tar private-app/.npmrc` to extract `private-app/.npmrc` from the layer tarball.
1. Run `cat private-app/.npmrc` to view the `.npmrc` file and npm token.

### #3 - Leaking npm tokens in the image commit history

[`Dockerfile-insecure-3`](https://github.com/alulsh/docker-npmrc-security/blob/master/Dockerfile-insecure-3)

To build this images, run `docker build . -f Dockerfile-insecure-3 -t insecure-app-3 --build-arg NPM_TOKEN=$NPM_TOKEN`.

#### Problem

```
ARG NPM_TOKEN

RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc && \
    npm install && \
    rm -f .npmrc
```

The `.npmrc` file is created, used, and deleted in the same `RUN` instruction and Docker layer. Since we passed in the npm token as a build argument (`ARG NPM_TOKEN`) our npm tokens are still leaked in the Docker image commit history. If the attacker gains access to the Docker daemon or obtains a copy of our Docker image then they can steal our npm tokens using [`docker history`](https://docs.docker.com/engine/reference/commandline/history/).

#### Exploitation

1. Run `docker history insecure-app-3`.

## Secure Dockerfiles

### Multi-stage builds

[`Dockerfile-secure`](https://github.com/alulsh/docker-npmrc-security/blob/master/Dockerfile-secure)

To build this image, run `docker build . -f Dockerfile-secure -t secure-app --build-arg NPM_TOKEN=$NPM_TOKEN`.

This `Dockerfile` uses [multi-stage builds](https://docs.docker.com/develop/develop-images/multistage-build/#use-an-external-image-as-a-stage) to protect our `.npmrc` file. In the first stage build we create our `.npmrc`, run `npm install`, and delete our `.npmrc`. We then copy over our built Node application to our second stage build. We can use the same base image - `node:8.11.3-alpine` - for both stages of our build.

To verify that this Docker image does not leak our npm tokens, run `docker history secure-app`.
