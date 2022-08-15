# ESO Migration scripts

As the existing kestoeso migration tool doesn't really work for me (it's really old and doesn't cover my bases), we've written a custom one in nodejs due to native json support.

## Prerequisites
* Nodejs.
* Yq.
* Jq.
* An authenticated session your cluster, and necessary permissions to manage secrets.

## How to run it
Just run `./entrypoint.sh` from the root of this repo. You'll need a terminal session that's been authenticated with your cluster. If the script fails and you need to tweak it before running again, run the `./cleanup.sh` script to reset, ready to try again with a tweaked script.

## Order of operations
1. Captures all current external secrets definitions as json manifests.
2. These are passed to a nodejs script that performs some data manipulation and chews the manifests until they resemble the new format.
3. The new manifests are applied to your kubernetes cluster.
4. The Kubernetes External Secrets controller deployment is scaled down to prevent any control conflicts with the new operator.
5. Patches are applied to each secret under the control of External Secrets - this switches the owner api to the External Secrets Operator and prevents owner deletion.
6. The External Secret Operator controller deployment is scaled up to take control over the secrets.
7. All external secrets no longer covered by the new operator are deleted.