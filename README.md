# Nested Web Workers with SvelteKit

## Multi threading compute intensive functions

I needed something to visualize web workers doing their thing so I put together this repo using SvelteKit (because it is awesome).

```bash
UI <--> Store <--> Main Web Worker <--> Sub Web Worker 1
                                   `--> Sub Web Worker 2
                                   `--> Sub Web Worker 3
                                   `--> Sub Web Worker 4
                                   `--> Sub Web Worker 5
                                   `--> Sub Web Worker n
```

There is a single Svelte store that handles communication between the Main web worker and the view components/ui.

There is a Main web worker that handles sending/receiving messages between itself and the store

Each Sub web worker (there can be any number of them) will run some compute intensive function on a separate cpu core/thread (if available).

![Screenshot of application](img/screen.gif?raw=true)



## Developing (Standard SvelteKit stuff)

Install dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

