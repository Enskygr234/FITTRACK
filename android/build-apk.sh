#!/usr/bin/env bash
# FITTRACK — Android APK derleme betiği
# Gereksinimler: Java 11+, apktool.jar ve uber-apk-signer.jar (bkz. README)
set -euo pipefail
cd "$(dirname "$0")"
ROOT=..
TOOLS=${TOOLS:-./tools}
OUT=${OUT:-./dist}
BUILD=./build

rm -rf "$BUILD" && mkdir -p "$BUILD/assets/www" "$OUT"
cp -r AndroidManifest.xml apktool.yml res smali "$BUILD/"
cp -r "$ROOT/index.html" "$ROOT/manifest.webmanifest" "$ROOT/css" "$ROOT/js" "$ROOT/assets" "$BUILD/assets/www/"

java -jar "$TOOLS/apktool.jar" b "$BUILD" -o "$BUILD/fittrack-unsigned.apk"
java -jar "$TOOLS/uber-apk-signer.jar" -a "$BUILD/fittrack-unsigned.apk" -o "$BUILD/signed" ${KEYSTORE:+--ks "$KEYSTORE" --ksAlias "$KS_ALIAS" --ksPass "$KS_PASS" --ksKeyPass "$KS_PASS"}
cp "$BUILD"/signed/*.apk "$OUT/FITTRACK-v2.1.0.apk"
echo "APK hazır: $OUT/FITTRACK-v2.1.0.apk"
