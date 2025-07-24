#!/bin/bash

source "${CI_PROJECT_DIR}/.gitlab-ci/common.sh"

CLI_DOWNLOAD_BASE=https://gitlab.com/api/v4/projects/gitlab-org%2Frelease-cli/packages/generic/release-cli
CLI_VERSION=latest
CLI_BINARY_NAME=release-cli-linux-amd64

install_cli() {
  curl "${CLI_DOWNLOAD_BASE}/${CLI_VERSION}/${CLI_BINARY_NAME}" --output ${CLI_BINARY_PATH}
  chmod +x ${CLI_BINARY_PATH}
  ${CLI_BINARY_PATH} -v
}

echo ""
echo "Install gitlab release-cli..."
install_cli
