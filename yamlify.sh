#! /bin/bash
# shellcheck disable=SC2001,2045
rm -rf yaml-out
mkdir yaml-out
for i in $(ls out/) ;
do
  outpath=$(echo "$i" | sed s/\.json$/\.yaml/) ;
  yq -P "out/$i" > "yaml-out/$outpath" ;
done