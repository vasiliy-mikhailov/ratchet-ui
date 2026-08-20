#!/bin/sh
# CUT A RELEASE TAG THAT CARRIES ITS OWN BUILD OUTPUT.
#
# WHY THE TAG HAS `dist/` IN IT WHEN `main` DOES NOT, which looks wrong until you try the
# alternative. This package is consumed over a git reference:
#
#     "ratchet-ui": "github:vasiliy-mikhailov/ratchet-ui#v0.1.0"
#
# pnpm resolves that to a codeload tarball of the tagged tree. The tarball is the repository, not an
# npm package, so whatever `main` gitignores is simply not there, and `exports` pointing at
# `./dist/index.js` points at nothing. The npm answer to that is a `prepare` script, which is a
# build the package manager runs after fetching. It was tried and measured, and pnpm 10 refuses:
#
#     ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED  The git-hosted package "ratchet-ui@0.1.0" needs to
#     execute build scripts but is not in the "onlyBuiltDependencies" allowlist.
#
# The allowlist entry it then asks for names the package by its RESOLVED COMMIT SHA, and a bare
# `ratchet-ui` is rejected. That is fatal rather than annoying: it writes the sha of this release
# into a second file in the consumer, so bumping the reference means editing two places, and the
# whole reason a consumer pins a git dependency is that one file, the lockfile, is the only thing
# that decides which bytes arrive. A sha in a hand-edited allowlist that has drifted from the
# lockfile fails in whichever direction nobody is looking.
#
# So the build happens here, once, at the moment of release, and the tag is a complete package. A
# consumer needs no allowlist, no transpile setting and no build step, and `--frozen-lockfile`
# remains the single gate it is supposed to be.
#
# THE COST IS THAT A TAG CAN BE STALE, and staleness is silent: committed JavaScript that no longer
# matches the TypeScript beside it type-checks perfectly. Two things hold it down. This script never
# commits a `dist` it did not just build from the tree it is tagging, and CI runs
# `git diff --exit-code -- dist` after building, which on a release commit asks exactly whether the
# committed output is the one the committed source produces.
#
# The release commit is a CHILD of main that is never merged back, so `main` keeps a history of
# source changes and the built files exist only where somebody asked for a package.
#
#     ./release.sh v0.1.0
set -eu

VERSION=${1:?usage: ./release.sh v0.1.0}
case "$VERSION" in
  v*) ;;
  *) echo "version must look like v0.1.0, got $VERSION" >&2; exit 1 ;;
esac

cd "$(dirname "$0")"

# THE TREE MUST BE CLEAN BEFORE ANY OF THIS. A release built from uncommitted edits is a package
# whose source nobody can look up, which is the one thing a tag is for.
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "working tree has uncommitted changes; commit or stash them first" >&2
  exit 1
fi

if git rev-parse -q --verify "refs/tags/$VERSION" >/dev/null; then
  echo "$VERSION already exists; tags are immutable, pick the next one" >&2
  exit 1
fi

# THE VERSION IN package.json IS THE AUTHORITY and the tag follows it, not the other way round. A
# tag that disagrees with the manifest inside it produces a package that installs as one version and
# reports another, and the reader who eventually notices has no way to tell which is the lie.
DECLARED=$(sed -n 's/.*"version": "\(.*\)".*/\1/p' package.json | head -1)
if [ "v$DECLARED" != "$VERSION" ]; then
  echo "package.json says $DECLARED, you asked for $VERSION; change one of them" >&2
  exit 1
fi

# BUILT IN A CONTAINER because this host has no node, and a release built against whatever runtime
# happened to be on one machine is the failure this repository's CI exists to rule out.
docker run --rm \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp -e COREPACK_HOME=/tmp/corepack -e CI=1 \
  -v "$PWD:/pkg" \
  -w /pkg node:22-bookworm sh -euc '
    mkdir -p /tmp/bin /tmp/corepack
    corepack enable --install-directory /tmp/bin
    export PATH=/tmp/bin:$PATH
    pnpm install --frozen-lockfile
    pnpm typecheck
    pnpm test
    rm -rf dist
    pnpm build'

# DETACHED FIRST, so the commit below lands on no branch at all. Committing on main would put built
# files in the history every future source change is written on top of, which is the arrangement
# this whole script exists to avoid.
git checkout -q --detach

# `-f` because dist is gitignored, which is right for every commit except this one.
git add -f dist
git commit -q -F - <<MESSAGE
$VERSION: the tagged tree, with the build output a git consumer needs

dist/ is committed here and nowhere else, because a codeload tarball is the
repository rather than an npm package and pnpm 10 will not run a prepare script
for a git dependency without a sha-keyed allowlist in the consumer. See
release.sh for the full reasoning.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MESSAGE
git tag -a "$VERSION" -m "ratchet-ui $VERSION"

# BACK TO MAIN IMMEDIATELY, leaving the release commit reachable only from the tag. Staying on it is
# how the next source change accidentally lands on top of a build output.
git checkout -q main

echo
echo "tagged $VERSION at $(git rev-parse --short "$VERSION^{commit}"), main is unchanged at $(git rev-parse --short main)"
echo "push it with:  git push origin $VERSION"
