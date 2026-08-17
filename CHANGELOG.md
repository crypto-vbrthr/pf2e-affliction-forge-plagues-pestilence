# Changelog

## 0.1.2

- Fixed non-portable test imports that referenced the build machine's absolute `/mnt/data/affliction_semantic` path.
- Contract tests now locate the installed PF2E Affliction Forge module by its `module.json` id, with `PF2E_AFFLICTION_FORGE_PATH` available as an explicit development override.
- Added a regression guard so release tests remain portable on Windows, Linux, and macOS.

## 0.1.1

- Fixed Foundry VTT 14 startup failure while indexing the managed compendium.
- Avoided requesting the parent `flags` field together with nested flag projections in `CompendiumCollection#getIndex`.
- Added a regression guard for the Foundry projection conflict.

## 0.1.0

- Initial release.
- Added 28 original diseases covering levels 0-20.
- Added German and English localization.
- Added semantic Creature Forge tags to every disease.
- Added provider-library registration through the Affliction Forge public API.
- Added managed world-compendium provisioning and synchronization.
- Added regression tests for schema validity, localization, level/DC balance, unique identities, and semantic-tag vocabulary.
