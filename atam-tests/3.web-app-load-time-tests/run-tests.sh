#!/bin/bash

docker run -it -v $PWD/e2e:/e2e -w /e2e cypress/included:3.2.0