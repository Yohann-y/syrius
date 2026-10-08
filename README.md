# Syrius

Syrius est une application mobile React Native construite avec Expo. Elle propose
six simulations interactives pour apprendre à reconnaître les arnaques. Le site
web sert uniquement au téléchargement de l’APK Android.

## Développement mobile

```sh
npm install
npm run mobile
```

Pour compiler et lancer l’application sur un appareil Android connecté :

```sh
npm run mobile:android
```

La compilation locale nécessite Java 17 ou supérieur et le SDK Android avec
l’API 36, les build-tools 36.0.0 et le NDK 27.1.12297006. Configurez
`ANDROID_HOME` ou `ANDROID_SDK_ROOT` pour pointer vers le SDK.

## Générer l’APK téléchargeable

```sh
npm run build:apk
```

Cette commande produit un APK autonome en mode release, ciblé sur les téléphones
ARM64, et le copie dans `public/syrius.apk`. Le bundle JavaScript est inclus :
Metro n’a pas besoin de tourner sur le téléphone pour ouvrir l’application.
L’APK est signé avec la clé de débogage Android pour l’installation et les tests,
pas pour une distribution officielle en magasin d’applications. Le bouton du
site télécharge ce fichier. Pour utiliser une autre URL, définissez
`VITE_APK_DOWNLOAD_URL` avant de construire le site.

## Site web et vérifications

```sh
npm run dev
npm run build
npm test
npm run lint
```
