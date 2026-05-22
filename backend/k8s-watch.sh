#!/bin/bash

# Konfigurasi
IMAGE_NAME="bestiary-backend"
TAG="v-dev"

build_and_deploy() {
    echo "--------------------------------------------------------"
    echo "$(date +'%H:%M:%S') - Perubahan terdeteksi, membangun ulang..."
    echo "--------------------------------------------------------"
    
    # Masuk ke environment Docker milik Minikube
    eval $(minikube docker-env)
    
    # Tambahkan TITIK di akhir untuk context directory
    # --no-cache memastikan folder assets yang baru ikut ditarik
    docker build --no-cache -t $IMAGE_NAME:$TAG .
    
    # Restart deployment
    kubectl rollout restart deployment/backend
    
    echo "--- Berhasil di-deploy ke Kubernetes ---"
    echo "Menunggu perubahan selanjutnya..."
}

# Jalankan build pertama kali saat script dijalankan
build_and_deploy

# Pantau folder src DAN assets secara rekursif
# Jika Anda menambah PCK ke folder assets, script ini akan otomatis rebuild
while inotifywait -r -e modify ./src ./assets; do
    build_and_deploy
done