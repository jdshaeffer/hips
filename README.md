# 🫥 hips 🫥

FE and BE for hips: an open-source, web-based party game inspired by the classic, ["hidden in plain sight"](https://www.nintendo.com/store/products/hidden-in-plain-sight-switch/)

> to play, head on to: [jdshaeffer.github.io/hips](https://jdshaeffer.github.io/hips/)

> for contributors, read on...

## developing

1. clone
2. install: `yarn`
3. start FE: `yarn start`
4. in another terminal tab/window - start BE: `yarn start-server`

## deploying

1. pushing FE will kick off the gh-pages build and deploy, so no need to worry about that
2. commit the compiled ts: `yarn tsc --project server/tsconfig.json`
3. go into server box, `git pull`, `pm2 restart hips_socket_server`
4. any nginx changes? config file lives at `/etc/nginx/sites-available/default`, run `service nginx restart` when ready
5. monitor using `pm2 monit`

## style guide

> some guidelines to follow when contributing:

- run `yarn prettify` to format the code before committing (we can eventually add this as a git hook, but no need quite yet)
  - if using vs code, include `"editor.formatOnSave": true` in your `settings.json`
- for readability, have all code blocks (even one liners) be separated in their own brackets
  - e.g. prefer this:
    ```typescript
    if (direction.length === 0) {
      setMoving(false);
    }
    ```
    over this:
    ```typescript
    if (direction.length === 0) setMoving(false);
    ```
