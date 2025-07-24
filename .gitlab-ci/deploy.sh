#!/bin/bash

source "${CI_PROJECT_DIR}/.gitlab-ci/common.sh"


ci_info

# echo "curl --header \"JOB-TOKEN: ${CI_JOB_TOKEN}\" \"${API_BASE}/${MANAGEMENT_TOOL_REPO_ID}/releases/${TAG_ENCODED}/assets/links\" | jq -r --arg f \"${PACKAGENAME}\" '.[]|select(.name | contains ($f)).direct_asset_url'"

ASSET_URL=$(curl --header "JOB-TOKEN: ${CI_JOB_TOKEN}" "${API_BASE}/${MANAGEMENT_TOOL_REPO_ID}/releases/${TAG_ENCODED}/assets/links" | jq -r --arg f "${PACKAGENAME}" '.[]|select(.name | contains ($f)).direct_asset_url')

echo $ASSET_URL

BASE_PATH_TEMPLATES=${CI_PROJECT_DIR}/.gitlab-ci/ansible
TEMPLATES=$(find "${BASE_PATH_TEMPLATES}" -type f -name "*.tmpl")

for file in ${TEMPLATES}
do
  envsubst < ${file} > ${file%.*}
done

ansible-playbook -i ${CI_PROJECT_DIR}/.gitlab-ci/ansible/inventory -e asset_url=${ASSET_URL} ${CI_PROJECT_DIR}/.gitlab-ci/ansible/playbook.yml
