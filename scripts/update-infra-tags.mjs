#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const deployEnvironment = process.env.DEPLOY_ENV || "staging";
const infraPath = process.env.INFRA_PATH || process.argv[2] || "../ai-task-platform-infra";
const imageTag = process.env.IMAGE_TAG;
const imageRegistry = (process.env.IMAGE_REGISTRY || "docker.io/YOUR_DOCKERHUB_USERNAME").replace(
  /\/$/,
  ""
);

if (!imageTag) {
  throw new Error("IMAGE_TAG is required");
}

const kustomizationPath = path.join(
  infraPath,
  "overlays",
  deployEnvironment,
  "kustomization.yaml"
);

const replacements = [
  {
    name: "ai-task-backend",
    newName: `${imageRegistry}/ai-task-backend`
  },
  {
    name: "ai-task-worker",
    newName: `${imageRegistry}/ai-task-worker`
  },
  {
    name: "ai-task-frontend",
    newName: `${imageRegistry}/ai-task-frontend`
  }
];

let content = fs.readFileSync(kustomizationPath, "utf8");

for (const replacement of replacements) {
  const pattern = new RegExp(
    `(  - name: ${replacement.name}\\n    newName: )[^\\n]+(\\n    newTag: )[^\\n]+`,
    "g"
  );

  content = content.replace(pattern, `$1${replacement.newName}$2${imageTag}`);
}

fs.writeFileSync(kustomizationPath, content);
console.log(`Updated ${deployEnvironment} image tags to ${imageTag}`);
