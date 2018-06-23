# Docker images and .npmrc security

This is a companion repo to a blog post I am writing about Docker images and `.npmrc` security. I'll update this README once I publish the blog post.

## Setup

To build these example Docker images you'll need git, Node.js, npm, an npm account, and Docker. You'll need to set an `NPM_TOKEN` environment variable so you can pass it as a build argument to Docker.

### Clone the repo

1. `git clone https://github.com/alulsh/docker-npmrc-security.git` or `git clone git@github.com:alulsh/docker-npmrc-security.git`
1. `cd docker-npmrc-security`

### Npm

1. Install Node.js and npm. I recommend using [nvm](https://github.com/creationix/nvm).
1. [Sign up](https://www.npmjs.com/signup) for an account on npmjs.com.
1. Run `npm login`.
1. Run `cat ~/.npmrc`.
1. Copy your npm token from `//registry.npmjs.org/:_authToken=<npm token>`.
1. Run `export NPM_TOKEN=<npm token>` to set your npm token as an environment variable.

### Docker

[Download the version of Docker CE](https://docs.docker.com/install/) for your operating system.

## Insecure Dockerfiles

### #1 - Leaving .npmrc files in Docker containers

[`Dockerfile-insecure-1`](https://github.com/alulsh/docker-npmrc-security/blob/master/Dockerfile-insecure-1).

To build this image, run `docker build . -f Dockerfile-insecure-1 -t insecure-app-1 --build-arg NPM_TOKEN=$NPM_TOKEN`.

### #2 - Leaving .npmrc files in Docker intermediate images

[`Dockerfile-insecure-2`](https://github.com/alulsh/docker-npmrc-security/blob/master/Dockerfile-insecure-2).

To build this image, run `docker build . -f Dockerfile-insecure-2 -t insecure-app-2 --build-arg NPM_TOKEN=$NPM_TOKEN`.

### #3 - Leaking npm tokens in the image commit history

[`Dockerfile-insecure-3`](https://github.com/alulsh/docker-npmrc-security/blob/master/Dockerfile-insecure-3).

To build this images, run `docker build . -f Dockerfile-insecure-3 -t insecure-app-3 --build-arg NPM_TOKEN=$NPM_TOKEN`.

## Secure Dockerfiles

### Multi-stage builds

[`Dockerfile-secure`](https://github.com/alulsh/docker-npmrc-security/blob/master/Dockerfile-secure).

To build this image, run `docker build . -f Dockerfile-secure -t secure-app --build-arg NPM_TOKEN=$NPM_TOKEN`.
