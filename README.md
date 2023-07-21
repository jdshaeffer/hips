# hips-web

FE repo for hips: an open-source, web-based party game inspired by the classic, ["hidden in plain sight"](https://www.nintendo.com/store/products/hidden-in-plain-sight-switch/)

companion BE repo: https://github.com/jdshaeffer/hips-server

> to play, head on to the (temp) domain: [nycmud.com](https://nycmud.com/)

> for contributors, read on...

## developing

1. clone
2. install: `yarn`
3. start FE: `yarn start`
4. go over to [the server repo](https://github.com/jdshaeffer/hips-server) and follow instructions there

## style guide

> some guidelines to follow when contributing:

- run `yarn prettify` to format the code before you commit (we can eventually add this as a git hook, but no need quite yet)
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
- always prefer `===` over `==`
- (this all applies to the server code as well)
