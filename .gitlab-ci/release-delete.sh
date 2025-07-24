#!/bin/bash

source "${CI_PROJECT_DIR}/.gitlab-ci/common.sh"

get_infos() {
  TAG_ENCODED=$(echo ${TAG////%2F})
  PACKAGES=$(curl --header "JOB-TOKEN: ${CI_JOB_TOKEN}" "${API_BASE}/${CI_PROJECT_ID}/packages?per_page=999" | jq --arg b "${CI_COMMIT_REF_SLUG}" '.[] | select ( .version | contains($b))')
  RELEASES=$(curl --header "JOB-TOKEN: ${CI_JOB_TOKEN}" "${API_BASE}/${CI_PROJECT_ID}/releases?per_page=999" | jq --arg b "${TAG}" '.[] | select ( .tag_name | contains($b))')
  TAGS=$(curl --header "PRIVATE-TOKEN: ${API_PRIVATE_TOKEN}" "${API_BASE}/${CI_PROJECT_ID}/repository/tags?per_page=999" | jq --arg b "${TAG}" '.[] | select ( .name | contains($b))')
  echo "PACKAGES: ${PACKAGES}"
  echo "RELEASES: ${RELEASES}"
  echo "TAGS:     ${TAGS}"
}


delete_packages() {
  echo "Run delete_packages"
  if [[ -z ${PACKAGES} ]]; then
    echo "No packages found. Skip."
  else
    echo "Packages found. Deleting."
    DEL_API_PATH=$(echo ${PACKAGES} | jq -r ._links.delete_api_path)
    for package in ${DEL_API_PATH}
    do
      curl --request DELETE --header "JOB-TOKEN: ${CI_JOB_TOKEN}" "${package}"
      echo "Delete package ${package}"
      sleep 1
    done
  fi
}

delete_releases() {
  echo "Run delete_releases"
  if [[ -z ${RELEASES} ]]; then
    echo "No releases found."
  else
    echo "${API_BASE}/${CI_PROJECT_ID}/releases/${TAG_ENCODED}"
    curl --request DELETE --header "JOB-TOKEN: ${CI_JOB_TOKEN}" "${API_BASE}/${CI_PROJECT_ID}/releases/${TAG_ENCODED}"
    sleep 1
  fi
}

delete_tags() {
  echo "Run delete_tags"
  if [[ -z ${TAGS} ]]; then
    echo "No tags found."
  else
    # curl --request DELETE --header "JOB-TOKEN: ${CI_JOB_TOKEN}" "${API_BASE}/${CI_PROJECT_ID}/repository/tags/${CI_COMMIT_REF_SLUG}"
    echo "${API_BASE}/${CI_PROJECT_ID}/repository/tags/${TAG_ENCODED}"
    curl --request DELETE --header "PRIVATE-TOKEN: ${API_PRIVATE_TOKEN}" "${API_BASE}/${CI_PROJECT_ID}/repository/tags/${TAG_ENCODED}"
    sleep 1
  fi
}

ci_info
get_infos
delete_packages
delete_releases
delete_tags
