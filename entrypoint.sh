#! /bin/bash
START=$(date +%s)
safe="$1"
# init
mkdir 'out' 'source'

if [ "$safe" == "safe" ] ;
then
  echo "Safe mode engaged" ;
else
  echo "Destructive mode coming on!" ;
fi
# get all existing external secret definitions
bash -c "$(kubectl get externalsecrets.kubernetes-client.io -A \
  -o=jsonpath='{range .items[*]}{"kubectl get externalsecrets.kubernetes-client.io -o json -n "}{.metadata.namespace}{" "}{.metadata.name}{" > source/"}{.metadata.namespace}{"-"}{.metadata.name}{".json; "}{end}')"

if [ ! "$safe" == "safe" ] ;
then
# ensure eso is scaled down for safety
  kubectl scale deployment -n external-secrets-operator external-secrets-operator --replicas=0
fi
# generate updated manifests for external secret definitions
node . > length.txt

if [ ! "$safe" == "safe" ] ;
then
# apply updates to all external secrets manifests
kubectl apply -f "out/"

# scale down old kubernetes external secrets deployment to prevent conflicts
kubectl scale deployment -n kubernetes-external-secrets kubernetes-external-secrets --replicas=0

# patch external secret ownership for updated secrets
while IFS= read -r line ;
do
  NAMESPACE=$(echo "$line" | cut -d '/' -f1)
  SECRET_NAME=$(echo "$line" | cut -d '/' -f2)
  kubectl patch secret "$SECRET_NAME" -n "$NAMESPACE" --type json --patch-file eso-patch-file.json
done < secretlist.txt

# scale up external secrets operator so it can take control
kubectl scale deployment -n external-secrets-operator external-secrets-operator --replicas=1

# remove all old external secret definitions from cluster
kubectl delete es --all -A
fi
# After-action report
END=$(date +%s)
COMPLETED_FILES=$(cat length.txt)
TIME=$((END-START))
FORMATTED_TIME=$(date -ju -f "%s" "$TIME" "+%Mm and %Ss")
echo "$COMPLETED_FILES secrets migrated in $FORMATTED_TIME"