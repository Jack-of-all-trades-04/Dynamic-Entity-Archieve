#!/bin/bash

# Fungsi untuk build dan restart
rebuild_and_deploy() {
    echo "--- Perubahan terdeteksi! Memulai Build Ulang ---"
    eval $(minikube docker-env)
    docker build -t bestiary-backend:v-dev .
    kubectl rollout restart deployment/backend
    echo "--- Deploy Selesai! Menunggu Pod Ready ---"
}

# Jalankan pertama kali
rebuild_and_deploy

# Pantau folder src menggunakan fswatch atau inotifywait
# Jika belum ada inotify-tools: sudo apt install inotify-tools
while inotifywait -r -e modify ./src; do
    rebuild_and_deploy
done