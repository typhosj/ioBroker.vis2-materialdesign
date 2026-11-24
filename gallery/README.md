# Live demo gallery

A static site that shows every widget of this adapter with demo data, in light and dark, Classic and
Material 3, English and German, on phone, wall tablet and desktop viewports. It runs without ioBroker
and is not part of the npm package.

## Scripts

Run them from the adapter root. Install `npm ci` and `npm ci --prefix src-widgets-ts` first.

- `npm run gallery:dev` starts the dev server.
- `npm run gallery:build` builds `gallery/dist` and prints the start page size. The build fails when the
  start page transfers more than 2 MB (gzip) or when a `.test` file lands in the bundle.
- `npm run gallery:test` runs the gallery unit tests (also part of `npm test`).

## Publishing on GitHub Pages

`.github/workflows/gallery.yml` builds on every pull request and every push to `master`. It publishes
only for `v*` release tags and for a manual run.

One-time setup by the repository owner:

1. Settings, Pages, Source: **GitHub Actions**.
2. Settings, Environments, `github-pages`, deployment branches and tags: add a tag rule `v*`. The
   environment that GitHub creates for Pages allows only the default branch, so without the rule a
   tag run fails with "Tag … is not allowed to deploy to github-pages due to environment protection
   rules".

The site is then served at `https://typhosj.github.io/ioBroker.vis2-materialdesign/`.

First publish: `workflow_dispatch` is only offered once the workflow file exists on the default branch.
Merge the branch that adds `gallery.yml` to `master` first, then run the workflow from the Actions tab
with `ref` set to `master` (or a tag). Before the merge there is no way to dispatch it from a feature branch.

## Preview of a pull request

Pull request runs upload the built site as the artifact `gallery-dist`, with no secrets involved.
Download it from the run page, unzip it and open it with:

    npx vite preview --outDir <unzipped folder>

or, from a checkout, `npm run gallery:build` and `npx vite preview --config gallery/vite.config.ts`.

Optionally the repository owner can connect Cloudflare Pages through its Git integration: build command
`npm ci && npm ci --prefix src-widgets-ts && npm run gallery:build`, output directory `gallery/dist`.
No token belongs in the repository.
