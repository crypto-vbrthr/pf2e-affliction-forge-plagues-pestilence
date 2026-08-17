# PF2E Affliction Forge: Plagues & Pestilence

`Plagues & Pestilence` is an original, bilingual disease library for **PF2E Affliction Forge**.

## Version 0.1.2

- 28 original staged diseases from level 0 to 20
- German and English localization
- PF2e-style Fortitude and Will save progressions
- onsets, daily/hourly stages, condition effects, damage, periodic damage, pre-action cough gates, virulent recovery, and selected death effects
- standardized Affliction Forge semantic tags for Creature Forge matching
- broad creature, family, habitat, theme, origin, and delivery coverage
- read-only provider library exposed through the Affliction Forge public Library API

## Semantic Creature Forge contract

Every definition is tagged in its root `themes` array using the Affliction Forge 0.1.63 semantic contract, for example:

```text
creature:animal
family:rat
habitat:urban
theme:disease
origin:natural
delivery:bite
```

Creature Forge and other consumers can use `api.libraries.search({ tags: ... })` or the public semantic scoring API without knowing anything about this module's internals.

## Content installation

Foundry module packages cannot ship a portable database that is safe across every world and current database format. On the first GM startup, this module provisions a managed **world Item compendium** named `world.affliction-forge-plagues-pestilence`, writes the current content into it, and registers that pack as a read-only Affliction Forge provider library.

The managed content is synchronized to the module version when a GM starts the world. Copies made into the normal Affliction Forge world library remain independent and editable.

## Requirements

- Foundry VTT 14
- PF2e 8.1.2+
- PF2E Affliction Forge 0.1.63+
- Critical Forge as required by Affliction Forge

## Content notice

All disease names, descriptions, and game content in this library are original homebrew content created for this module. They are not reproductions of published Paizo disease entries.

## Development tests

`npm test` resolves the required Affliction Forge contract from a sibling module whose `module.json` id is `pf2e-affliction-forge`. For non-standard development layouts, set `PF2E_AFFLICTION_FORGE_PATH` to the Affliction Forge module directory before running the tests. No release test contains build-machine absolute paths.
