#!/bin/bash

# common vars

CLI_BINARY_PATH=/usr/local/bin/release-cli

# common functions

## get opencast version from pom.xml
get_oc_version() {
  OC_VERSION=$(cat ${CI_PROJECT_DIR}/pom.xml | grep "<version>" | head -n1 | cut -d '>' -f2 | cut -d '<' -f1)
  OC_MAJOR=$(cat ${CI_PROJECT_DIR}/pom.xml | grep "<version>" | head -n1 | sed -nre "s/^[^0-9]*(([0-9]+\.)*[0-9]+).*/\1/p")
#   OC_MAJOR=$(echo ${OC_VERSION} | cut -d '-' -f1)
  echo "OC_VERSION:         ${OC_VERSION}"
  echo "OC_MAJOR:           ${OC_MAJOR}"

}

## get ci info
ci_info() {
  get_oc_version
  if [ ${CI_COMMIT_REF_NAME} == "develop" ]; then
    TAG="latest"
    NAME="Development Release ${OC_VERSION}: ${CI_COMMIT_REF_NAME}"
  elif [ ${CI_COMMIT_REF_NAME} == "master" ]; then
    TAG="stable"
    NAME="Stable Release ${OC_VERSION}: ${CI_COMMIT_REF_NAME}"
  elif [ ${CI_COMMIT_REF_NAME} == "next" ]; then
    TAG="staging"
    NAME="Staging Release ${OC_VERSION}: ${CI_COMMIT_REF_NAME}"
  elif [[ ${CI_COMMIT_REF_NAME} == r/* ]]; then
    TAG=$(echo ${CI_COMMIT_REF_NAME} | sed 's/r/s/')
    NAME="Snapshot Release ${CI_COMMIT_REF_NAME}: ${OC_VERSION}"
  else
    TAG="f/${CI_COMMIT_REF_SLUG}"
    NAME="Feature Branch ${OC_VERSION}: ${CI_COMMIT_REF_NAME}"
  fi
  TAG_ENCODED=$(echo ${TAG////%2F})

  echo "CI_COMMIT_REF_NAME: ${CI_COMMIT_REF_NAME}"
  echo "CI_COMMIT_REF_SLUG: ${CI_COMMIT_REF_SLUG}"
  echo "TAG:                ${TAG}"
  echo "TAG_ENCODED:        ${TAG_ENCODED}"
  echo "NAME:               ${NAME}"
}
