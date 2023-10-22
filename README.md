# 🫥 hips 🫥

FE and BE for hips: an open-source, web-based party game inspired by the classic, ["hidden in plain sight"](https://www.nintendo.com/store/products/hidden-in-plain-sight-switch/)

> to play, head on to: [jdshaeffer.github.io/hips](https://jdshaeffer.github.io/hips/)

> for contributors, read on...

## developing

1. clone
2. install: `yarn`
3. start FE: `yarn start`
4. in another terminal tab/window - start BE: `yarn start-server`

## style guide

> some guidelines to follow when contributing:

- run `yarn prettify` to format the code before committing (we can eventually add this as a git hook, but no need quite yet)
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
