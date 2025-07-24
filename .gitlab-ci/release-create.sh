#!/bin/bash

source "${CI_PROJECT_DIR}/.gitlab-ci/common.sh"

get_infos() {
  PACKAGE_ID=$(curl --header "JOB-TOKEN: ${CI_JOB_TOKEN}" "${API_BASE}/${CI_PROJECT_ID}/packages?per_page=999" | jq --arg b "${CI_COMMIT_REF_SLUG}" '.[] | select ( .version | contains($b)) | .id')
  echo "PACKAGE_ID:         ${PACKAGE_ID}"
  echo ""

  FILES=$(curl --header "PRIVATE-TOKEN: ${API_PRIVATE_TOKEN}" "${API_BASE}/${CI_PROJECT_ID}/packages/${PACKAGE_ID}/package_files?per_page=999" | jq -r '.[].file_name')
  for file in ${FILES}
  do
    ASSET=$(echo "--assets-link {\"name\":\"${file}\",\"url\":\"${PACKAGE_REGISTRY_URL}/${PACKAGENAME}/${CI_COMMIT_REF_SLUG}/${file}\",\"link_type\":\"package\"}")
    echo "Found asset:      ${file}"
    ASSETS="${ASSETS} ${ASSET}"
  done
}

echo "Gather facts for creating release..."
echo ""
ci_info
get_infos
echo ""
echo ""

echo "Create Release..."
${CLI_BINARY_PATH} create --name "${NAME}" --tag-name ${TAG} ${ASSETS}
