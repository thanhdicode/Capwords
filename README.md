# Independent Vocabulary-Learning Study

This experimental vocabulary-learning app is an independent academic study built with Expo, React Native, and TypeScript. It explores a camera-first way to collect words, practice pronunciation, and review vocabulary over time.

> **Project status:** research prototype only, not production-ready. This project is not an official CapWords app and is not affiliated with or endorsed by CapWords or its operators. Some prototype screens and visual assets are reference-derived; see [Asset and brand rights](#asset-and-brand-rights).

## Highlights

- Local-first vocabulary collection with editing, favorites, and review scheduling.
- Camera/photo selection, image cropping and manipulation, and operating-system speech playback where supported.
- Expo web and progressive-web-app builds, plus native Expo entry points.
- Optional Appwrite authentication/private media and an optional Cloudflare Worker for image recognition. The app remains usable in manual-entry mode without cloud configuration.
- Unit and UI tests for selected flows.

Several screens are prototypes or placeholders. In particular, the paywall does not process payments; automatic cloud sync, account deletion, and some native capabilities are not implemented. See [Known limitations](#known-limitations).

## Getting started

### Requirements

- Node.js and npm versions supported by the installed Expo SDK.
- For native device testing, the corresponding iOS/Android development tools or an Expo development build.

### Install and run

```bash
git clone https://github.com/thanhdicode/Capwords.git
cd Capwords
npm ci
cp .env.example .env.local
npm run web
```

To start the Expo development server for other targets, run `npm start`; then choose an available platform. You can also use `npm run android` or `npm run ios` when the required native tooling is installed.

The app can run without cloud services. Leave the cloud variables in `.env.local` blank to use local storage and manual word entry. To enable optional cloud features, configure the public client values described below and set up the backend separately.

## Configuration

`.env.example` lists the client-side variables. Expo variables prefixed with `EXPO_PUBLIC_` are embedded in the client bundle and **must never contain API keys, passwords, JWTs, private tokens, or administrative credentials**.

- `EXPO_PUBLIC_APPWRITE_ENDPOINT`, `EXPO_PUBLIC_APPWRITE_PROJECT_ID`, and `EXPO_PUBLIC_APPWRITE_BUCKET_ID` configure optional Appwrite services.
- `EXPO_PUBLIC_APPWRITE_PLATFORM` selects the registered app platform identifier.
- `EXPO_PUBLIC_RECOGNITION_ENDPOINT` optionally points to an authenticated HTTPS recognition service. Leave it blank to use manual naming.
- `EXPO_PUBLIC_ENABLE_STUDIO=0` disables the development comparison studio for a production web export.

The optional Worker implementation and deployment notes are in [`backend/worker/README.md`](backend/worker/README.md). Keep Worker/provider credentials in the hosting provider's secret store, never in this repository or in an `EXPO_PUBLIC_` variable.

## Useful commands

```bash
npm run typecheck       # TypeScript check
npm test                # Domain and utility tests
npm run test:ui         # Playwright UI tests
npm run build:web       # Expo web export
npm run build:pwa       # PWA export
npm run test:pwa        # PWA checks
npm run lint            # ESLint
```

To preview a PWA export locally:

```bash
npm run build:pwa
python3 -m http.server 8086 --directory dist-pwa
```

The UI tests may require a locally installed Playwright browser. Visual reference captures and QA output are intentionally not included in this public repository.

## Project layout

```text
src/domain/       Vocabulary and review logic
src/screens/      App screens and flows
src/components/   Reusable interface components
src/state/        Local state and persistence
src/services/     Recognition and other service boundaries
src/cloud/        Optional cloud client/schema handling
backend/worker/   Optional image-recognition Worker
modules/          Local Expo modules
assets/           App runtime images and icons
scripts/          Build and development utilities
tests/            Unit and UI tests
```

## Known limitations

This is a research build, not a release candidate. Some flows remain UI-only or incomplete, and behavior can vary by platform. There are no signed production APK/IPA builds or claims of complete testing on physical devices. The paywall is a demo and does not charge users. Cloud features require separately provisioned services and credentials; no production service configuration is included here.

## Contributing

Issues and pull requests are welcome. Please describe the change and the platform tested. Before submitting, run `npm run typecheck` and `npm test`; run the relevant UI or platform checks when changing those areas. Do not commit `.env.local`, service credentials, user data, build output, reference captures, or test artifacts.

For security concerns, avoid posting exploitable details in a public issue; use the repository's private security reporting option if it is enabled.

## License

The project source code is licensed under the [MIT License](LICENSE), subject to the exclusions below.

### Asset and brand rights

The MIT license applies to project-authored source code only. It does not grant rights to third-party names, trademarks, photographs, fonts, or visual assets. The repository includes study/prototype and reference-derived assets whose provenance or redistribution rights have not been independently verified. Do not reuse or redistribute those assets without confirming rights with the relevant owners. The CapWords name and marks belong to their respective owners; this independent academic study is not affiliated with or endorsed by them.
