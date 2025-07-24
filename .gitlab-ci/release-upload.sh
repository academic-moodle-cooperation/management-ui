#!/bin/bash

source "${CI_PROJECT_DIR}/.gitlab-ci/common.sh"

# DISTS=$(find ${CI_PROJECT_DIR}/build -name "opencast-dist-*-*.tar.gz")
JARS_MUI=$(find ${CI_PROJECT_DIR}/apps ${CI_PROJECT_DIR}/backend -name "*.jar")
JARS_GQL=$(find ../${CI_PROJECT_DIR}/opencast-graphql -name "*graphql*.jar")
TARGET_DIR=${CI_PROJECT_DIR}/build


mkdir -p ${TARGET_DIR}

for jars in ${JARS_MUI}; do
  cp ${jars} ${TARGET_DIR}/
done

for jars in ${JARS_GQL}; do
  cp ${jars} ${TARGET_DIR}/
done


cd ${TARGET_DIR}
tar -cvzf ${CI_PROJECT_DIR}/${PACKAGENAME}.tar.gz *
curl --header "JOB-TOKEN: ${CI_JOB_TOKEN}" --upload-file ${CI_PROJECT_DIR}/${PACKAGENAME}.tar.gz ${PACKAGE_REGISTRY_URL}/${PACKAGENAME}/${CI_COMMIT_REF_SLUG}/${PACKAGENAME}.tar.gz
