#!/usr/bin/env bash
set -euo pipefail

kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Waiting for Argo CD server..."
kubectl -n argocd rollout status deployment/argocd-server --timeout=180s

kubectl apply -f ../ai-task-platform-infra/argocd/ai-task-platform-staging.yaml
kubectl apply -f ../ai-task-platform-infra/argocd/ai-task-platform-production.yaml

echo "Initial admin password:"
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
echo
