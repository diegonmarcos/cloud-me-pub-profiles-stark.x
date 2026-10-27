# DeepSc-StarkX

Stark company site (TypeScript + SCSS + shaders, vanilla framework).

## Repository

Member of the [DeepSc](https://github.com/diegonmarcos/DeepSc) hub. This repo is the single source of the project; it was moved out of `front-endeavours` (`a_Companies/stark`) in ticket #1224 and `front-endeavours/a_Companies/stark` is now a symlink to this checkout.

- Published at https://diegonmarcos.github.io/stark/ (URL unchanged).
- Layout follows the deployer conventions: project at the repo root, `build.json`, `build.sh` and `ship.yml` symlinks into `1_cicd` / `.github`, which in turn point into the `0_deployer` submodule (diegonmarcos.github.io, shallow, `ignore = all`).
- The deployer (diegonmarcos.github.io, Pages workflow) clones THIS repo and overlays it at `a_Companies/stark`; it never builds through the front-endeavours symlink.
