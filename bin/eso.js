#! /usr/bin/env node
const fs = require('fs');

const buildTargetStructure = function(nameSpace, secretName, backend, secretStoreName, sourceSecretData) {
  const outputSecretData = [];
  let dataPoint;
  for (let i = 0; i < sourceSecretData.length; i++) {
    if (backend === 'systemManager') {
      dataPoint = {
        secretKey: sourceSecretData[i].name,
        remoteRef: {
          key: sourceSecretData[i].key
        }
      };
      outputSecretData.push(dataPoint);
    } else if (backend === 'secretsManager' || backend === 'secretManager') {
      dataPoint = {
        secretKey: sourceSecretData[i].name,
        remoteRef: {
          key: sourceSecretData[i].key,
          property: sourceSecretData[i].property
        }
      };
    };
    outputSecretData.push(dataPoint);
  };
  const newStructure = {
    apiVersion: 'external-secrets.io/v1beta1',
    kind: 'ExternalSecret',
    metadata: {
      name: secretName,
      namespace: nameSpace
    },
    spec: {
      secretStoreRef: {
        name: secretStoreName,
        kind: 'ClusterSecretStore'
      },
      refreshInterval: "1h",
      target: {
        name: secretName,
        creationPolicy: "Owner"
      },
      data: outputSecretData
    }
  };
  return JSON.stringify(newStructure);
}

let sourceManifest;
fs.readdirSync('./source').forEach(file => {
  sourceManifest = require(`../source/${file}`);
  const nameSpace = sourceManifest.metadata.namespace;
  const secretName = sourceManifest.metadata.name;
  let sourceSecretData, backend, secretStoreName;
  if (sourceManifest.spec) {
    sourceSecretData = sourceManifest.spec.data;
    backend = sourceManifest.spec.backendType;
  } else {
    sourceSecretData = sourceManifest.secretDescriptor.data;
    backend = sourceManifest.secretDescriptor.backendType;
  };  
  if (backend === 'systemManager') {
    secretStoreName = 'cluster-secret-store-ssm-ps';
  } else if (backend === 'secretsManager' || backend === 'secretManager') {
    secretStoreName = 'cluster-secret-store-sm';
  };
  fs.writeFileSync(`./out/${file}`, buildTargetStructure(nameSpace, secretName, backend, secretStoreName, sourceSecretData));
  fs.appendFileSync('./secretlist.txt', `${nameSpace}/${secretName}\n`);
});
const fileListLength = fs.readdirSync('./source').length;
console.log(fileListLength);