const MODULE_ID = "pf2e-affliction-forge-plagues-pestilence";
const CONTENT_VERSION = "0.1.2";
const I18N_PREFIX = "PF2E_AFFLICTION_PP.Content";

const token = (slug, key) => `@i18n:${I18N_PREFIX}.${slug}.${key}`;
const restrictions = ({ locks = [], healing = "none", damageTypes = [], blocked = [] } = {}) => ({ conditionLocks: locks.map(([slug, minimum]) => ({ slug, minimum })), healing, unhealableDamageTypes: [...damageTypes], blockedCapabilities: [...blocked] });
const duration = ([value, unit]) => ({ value, unit });
const condition = (slug, value = null) => value == null ? { type: "condition", slug } : { type: "condition", slug, value };
const damage = (formula, damageType, persistent = false) => ({ type: "damage", formula, damageType, ...(persistent ? { persistent: true } : {}) });
const death = (category = "death-effect") => ({ type: "death", category });

function effect(slug, stageNumber, components, nameKey = null) {
  if (!components.length) return null;
  return { schemaVersion: 2, id: `${MODULE_ID}.${slug}.stage-${stageNumber}`, name: token(slug, nameKey ?? `Stage${stageNumber}.Name`), duration: { value: -1, unit: "unlimited", expiry: null }, components, application: {}, metadata: { originModule: MODULE_ID, originFeature: "plagues-pestilence-stage" } };
}

function componentFromSpec(entry) {
  if (entry[0] === "condition") return condition(entry[1], entry[2]);
  if (entry[0] === "damage") return damage(entry[1], entry[2], false);
  if (entry[0] === "damagePersistent") return damage(entry[1], entry[2], true);
  if (entry[0] === "death") return death(entry[1]);
  throw new Error(`Unsupported Plagues & Pestilence component type: ${entry[0]}`);
}

function makeStage(slug, stageNumber, stageSpec) {
  const [durationSpec, componentSpecs, options = {}] = stageSpec;
  const components = componentSpecs.map(componentFromSpec);
  const stageRestrictions = restrictions({ healing: options.healing ?? "none", blocked: options.blockSpeak ? ["speak"] : [] });
  const preActionGates = options.gate ? [{ id: `${slug}.stage-${stageNumber}.cough`, label: token(slug, `Stage${stageNumber}.Gate`), trigger: { actionKinds: ["spell-cast", "item-activation"], requiredTraits: ["concentrate"] }, check: { kind: "flat", dc: options.gate }, blockOnFailure: true }] : [];
  const periodicEffects = options.periodic ? [{ id: `${slug}.stage-${stageNumber}.periodic`, label: token(slug, `Stage${stageNumber}.Periodic`), interval: { value: options.periodic[0], unit: options.periodic[1] }, effect: effect(slug, `${stageNumber}-periodic`, [damage(options.periodic[2], options.periodic[3])], `Stage${stageNumber}.Periodic`) }] : [];
  return { id: `stage-${stageNumber}`, number: stageNumber, name: token(slug, `Stage${stageNumber}.Name`), description: token(slug, `Stage${stageNumber}.Description`), duration: duration(durationSpec), expiryAction: options.expiry ?? "check", check: null, restrictions: stageRestrictions, effectPersistence: "stage", effectPersistenceDuration: null, effectComponentPersistence: [], effectComponentPersistenceDurations: [], effect: effect(slug, stageNumber, components), numericModifiers: [], periodicEffects, preActionGates, reactions: [] };
}

function makeDefinition(spec) {
  const save = spec.save ?? ["player", "public"];
  const themes = Object.entries(spec.tags).flatMap(([namespace, values]) => values.map((value) => `${namespace}:${value}`));
  return { schemaVersion: 2, id: `${MODULE_ID}.${spec.slug}`, name: token(spec.slug, "Name"), description: token(spec.slug, "Description"), img: "icons/svg/biohazard.svg", afflictionType: "disease", level: spec.level, rarity: spec.rarity, traits: ["disease"], themes, saveDefaults: { execution: save[0], visibility: save[1] }, identification: { initialState: spec.identification ?? "identified" }, delivery: { injuryPoison: false }, multipleExposure: "default", restrictions: restrictions({ locks: spec.locks ?? [], healing: spec.rootHealing ?? "none" }), checks: [{ id: "primary", label: token(spec.slug, "SaveLabel"), kind: "save", statistic: spec.stat, dcMode: "fixed", dc: spec.dc, policy: null }], initialCheck: { checkIds: ["primary"], combine: "single", outcomes: { criticalSuccess: { action: "reject" }, success: { action: "reject" }, failure: { action: "set-stage", stage: 1 }, criticalFailure: { action: "set-stage", stage: 2 } } }, onset: spec.onset ? duration(spec.onset) : null, maximumDuration: null, defaultStageCheck: { checkIds: ["primary"], combine: "single", outcomes: { criticalSuccess: { action: "stage-delta", delta: -2 }, success: { action: "stage-delta", delta: -1 }, failure: { action: "stage-delta", delta: 1 }, criticalFailure: { action: "stage-delta", delta: 2 } } }, progression: { belowStageOne: "recover", aboveMaximumStage: "clamp", virulent: spec.virulent === true }, stages: spec.stages.map((stage, index) => makeStage(spec.slug, index + 1, stage)), metadata: { originModule: MODULE_ID, originFeature: "plagues-pestilence-library", contentVersion: CONTENT_VERSION, contentLicense: "original-homebrew", creatureForgeReady: true } };
}

const SPECS = [
  {
    "slug": "marsh-rash",
    "level": 0,
    "dc": 14,
    "rarity": "common",
    "stat": "fortitude",
    "onset": [
      6,
      "hours"
    ],
    "tags": {
      "creature": [
        "animal",
        "humanoid"
      ],
      "habitat": [
        "swamp"
      ],
      "theme": [
        "disease"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "contact"
      ]
    },
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "clumsy",
            2
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "ratbite-fever",
    "level": 1,
    "dc": 15,
    "rarity": "common",
    "stat": "fortitude",
    "onset": [
      1,
      "days"
    ],
    "tags": {
      "creature": [
        "animal",
        "humanoid"
      ],
      "family": [
        "rat"
      ],
      "habitat": [
        "urban",
        "underground"
      ],
      "theme": [
        "disease",
        "blood"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "bite",
        "injury"
      ]
    },
    "locks": [
      [
        "sickened",
        1
      ]
    ],
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "redwater-fever",
    "level": 2,
    "dc": 16,
    "rarity": "common",
    "stat": "fortitude",
    "onset": [
      12,
      "hours"
    ],
    "tags": {
      "creature": [
        "animal",
        "humanoid"
      ],
      "habitat": [
        "aquatic",
        "swamp"
      ],
      "theme": [
        "disease"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "ingested",
        "contact"
      ]
    },
    "locks": [
      [
        "sickened",
        1
      ]
    ],
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "drained",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "lantern-moth-ague",
    "level": 2,
    "dc": 16,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": [
      1,
      "days"
    ],
    "tags": {
      "creature": [
        "animal"
      ],
      "family": [
        "insect"
      ],
      "habitat": [
        "forest",
        "jungle"
      ],
      "theme": [
        "disease"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "contact",
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "dazzled",
            null
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "dazzled",
            null
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "blinded",
            null
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "ash-cough",
    "level": 3,
    "dc": 18,
    "rarity": "common",
    "stat": "fortitude",
    "onset": [
      4,
      "hours"
    ],
    "tags": {
      "creature": [
        "humanoid",
        "animal"
      ],
      "habitat": [
        "volcanic",
        "underground"
      ],
      "theme": [
        "disease"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "locks": [
      [
        "sickened",
        1
      ]
    ],
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {
          "gate": 5
        }
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ]
        ],
        {
          "gate": 10,
          "blockSpeak": true
        }
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "unconscious",
            null
          ],
          [
            "condition",
            "drained",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "thorn-blight",
    "level": 3,
    "dc": 18,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": [
      1,
      "days"
    ],
    "tags": {
      "creature": [
        "plant"
      ],
      "habitat": [
        "forest",
        "jungle"
      ],
      "theme": [
        "disease"
      ],
      "origin": [
        "natural",
        "primal"
      ],
      "delivery": [
        "contact",
        "injury"
      ]
    },
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "enfeebled",
            1
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "enfeebled",
            2
          ],
          [
            "condition",
            "clumsy",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "salt-lung",
    "level": 4,
    "dc": 19,
    "rarity": "common",
    "stat": "fortitude",
    "onset": [
      8,
      "hours"
    ],
    "tags": {
      "creature": [
        "humanoid",
        "animal"
      ],
      "habitat": [
        "coastal",
        "aquatic"
      ],
      "theme": [
        "disease"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {
          "blockSpeak": true
        }
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "unconscious",
            null
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "frost-vein",
    "level": 4,
    "dc": 19,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": [
      1,
      "days"
    ],
    "tags": {
      "creature": [
        "animal",
        "humanoid"
      ],
      "habitat": [
        "arctic",
        "mountain"
      ],
      "theme": [
        "disease",
        "elemental"
      ],
      "origin": [
        "natural",
        "primal"
      ],
      "delivery": [
        "contact"
      ]
    },
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "damage",
            "1d6",
            "cold"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "clumsy",
            3
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "paralyzed",
            null
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "blackroot-rot",
    "rootHealing": "affliction-damage",
    "level": 5,
    "dc": 20,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": [
      1,
      "days"
    ],
    "tags": {
      "creature": [
        "fungus",
        "plant"
      ],
      "family": [
        "parasite"
      ],
      "habitat": [
        "forest",
        "underground"
      ],
      "theme": [
        "disease",
        "fungal",
        "parasite"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "contact",
        "injury"
      ]
    },
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "enfeebled",
            2
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "enfeebled",
            2
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "damage",
            "2d6",
            "void"
          ]
        ],
        {
          "healing": "affliction-damage"
        }
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "unconscious",
            null
          ],
          [
            "condition",
            "drained",
            3
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "carrion-fever",
    "level": 5,
    "dc": 20,
    "rarity": "common",
    "stat": "fortitude",
    "onset": [
      6,
      "hours"
    ],
    "tags": {
      "creature": [
        "animal",
        "humanoid"
      ],
      "habitat": [
        "plains",
        "urban"
      ],
      "theme": [
        "disease",
        "blood"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "bite",
        "contact"
      ]
    },
    "locks": [
      [
        "sickened",
        1
      ]
    ],
    "stages": [
      [
        [
          12,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          12,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          12,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "unconscious",
            null
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "mirelung",
    "level": 6,
    "dc": 22,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": [
      1,
      "days"
    ],
    "tags": {
      "creature": [
        "animal",
        "humanoid"
      ],
      "habitat": [
        "swamp"
      ],
      "theme": [
        "disease",
        "fungal"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "fatigued",
            null
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "fatigued",
            null
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "unconscious",
            null
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "sporewake",
    "level": 6,
    "dc": 22,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": [
      4,
      "hours"
    ],
    "tags": {
      "creature": [
        "fungus"
      ],
      "habitat": [
        "underground",
        "forest"
      ],
      "theme": [
        "disease",
        "fungal",
        "spores"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "periodic": [
            6,
            "hours",
            "1d6",
            "poison"
          ]
        }
      ]
    ]
  },
  {
    "slug": "sewer-crown",
    "level": 7,
    "dc": 23,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": [
      2,
      "days"
    ],
    "tags": {
      "creature": [
        "animal",
        "humanoid"
      ],
      "family": [
        "rat",
        "insect"
      ],
      "habitat": [
        "urban",
        "underground"
      ],
      "theme": [
        "disease",
        "blood"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "ingested",
        "contact"
      ]
    },
    "virulent": true,
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "stupefied",
            3
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "unconscious",
            null
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "glassblood",
    "level": 7,
    "dc": 23,
    "rarity": "rare",
    "stat": "fortitude",
    "onset": [
      1,
      "days"
    ],
    "tags": {
      "creature": [
        "humanoid",
        "aberration"
      ],
      "habitat": [
        "urban",
        "underground"
      ],
      "theme": [
        "disease",
        "blood",
        "mutation"
      ],
      "origin": [
        "magical"
      ],
      "delivery": [
        "injury"
      ]
    },
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "drained",
            1
          ],
          [
            "damagePersistent",
            "1d6",
            "bleed"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "drained",
            2
          ],
          [
            "damagePersistent",
            "2d6",
            "bleed"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "unconscious",
            null
          ],
          [
            "condition",
            "drained",
            3
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "dreamscar-fever",
    "level": 8,
    "dc": 24,
    "rarity": "rare",
    "stat": "will",
    "onset": [
      1,
      "days"
    ],
    "tags": {
      "creature": [
        "aberration",
        "humanoid"
      ],
      "habitat": [
        "urban",
        "planar"
      ],
      "theme": [
        "disease",
        "dream",
        "mental"
      ],
      "origin": [
        "occult"
      ],
      "delivery": [
        "ability"
      ]
    },
    "save": [
      "gm",
      "gmOnly"
    ],
    "identification": "hidden",
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "fatigued",
            null
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "fatigued",
            null
          ],
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "frightened",
            2
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "unconscious",
            null
          ],
          [
            "condition",
            "stupefied",
            3
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "ember-pox",
    "level": 8,
    "dc": 24,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": [
      12,
      "hours"
    ],
    "tags": {
      "creature": [
        "elemental",
        "humanoid"
      ],
      "habitat": [
        "volcanic"
      ],
      "theme": [
        "disease",
        "elemental"
      ],
      "origin": [
        "primal",
        "magical"
      ],
      "delivery": [
        "contact"
      ]
    },
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ],
          [
            "damage",
            "1d6",
            "fire"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "damage",
            "2d6",
            "fire"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "enfeebled",
            2
          ],
          [
            "damage",
            "3d6",
            "fire"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "unconscious",
            null
          ],
          [
            "condition",
            "drained",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "grave-mold",
    "level": 9,
    "dc": 26,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": [
      1,
      "days"
    ],
    "tags": {
      "creature": [
        "fungus",
        "undead"
      ],
      "habitat": [
        "underground"
      ],
      "theme": [
        "disease",
        "fungal",
        "necrotic",
        "spores"
      ],
      "origin": [
        "undead"
      ],
      "delivery": [
        "inhaled",
        "contact"
      ]
    },
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "drained",
            2
          ],
          [
            "damage",
            "2d6",
            "void"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ],
          [
            "damage",
            "3d6",
            "void"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "paralyzed",
            null
          ],
          [
            "condition",
            "drained",
            3
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "hollow-fever",
    "level": 10,
    "dc": 27,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": [
      2,
      "days"
    ],
    "tags": {
      "creature": [
        "animal",
        "humanoid"
      ],
      "family": [
        "parasite",
        "worm"
      ],
      "habitat": [
        "jungle",
        "swamp"
      ],
      "theme": [
        "disease",
        "parasite"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "ingested"
      ]
    },
    "virulent": true,
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "drained",
            2
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "drained",
            3
          ],
          [
            "condition",
            "enfeebled",
            2
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "unconscious",
            null
          ],
          [
            "condition",
            "drained",
            3
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "whisperworms",
    "level": 11,
    "dc": 28,
    "rarity": "rare",
    "stat": "fortitude",
    "onset": [
      1,
      "days"
    ],
    "tags": {
      "creature": [
        "aberration"
      ],
      "family": [
        "worm",
        "parasite"
      ],
      "habitat": [
        "underground",
        "planar"
      ],
      "theme": [
        "disease",
        "parasite",
        "mental"
      ],
      "origin": [
        "planar"
      ],
      "delivery": [
        "bite",
        "ingested"
      ]
    },
    "virulent": true,
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "stupefied",
            3
          ],
          [
            "condition",
            "confused",
            null
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "confused",
            null
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "rift-ague",
    "level": 12,
    "dc": 30,
    "rarity": "rare",
    "stat": "will",
    "onset": [
      1,
      "hours"
    ],
    "tags": {
      "creature": [
        "aberration"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "disease",
        "corruption",
        "mental"
      ],
      "origin": [
        "planar"
      ],
      "delivery": [
        "aura",
        "inhaled"
      ]
    },
    "save": [
      "gm",
      "gmOnly"
    ],
    "identification": "suspected",
    "virulent": true,
    "stages": [
      [
        [
          12,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          12,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          12,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            3
          ],
          [
            "condition",
            "slowed",
            1
          ],
          [
            "condition",
            "confused",
            null
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "unconscious",
            null
          ],
          [
            "condition",
            "stupefied",
            4
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "crownspore",
    "level": 13,
    "dc": 31,
    "rarity": "rare",
    "stat": "fortitude",
    "onset": [
      6,
      "hours"
    ],
    "tags": {
      "creature": [
        "fungus",
        "plant"
      ],
      "habitat": [
        "forest",
        "jungle"
      ],
      "theme": [
        "disease",
        "spores",
        "fungal",
        "mutation"
      ],
      "origin": [
        "primal"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "virulent": true,
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "stupefied",
            3
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "confused",
            null
          ],
          [
            "condition",
            "enfeebled",
            3
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "starfall-sickness",
    "level": 15,
    "dc": 34,
    "rarity": "rare",
    "stat": "fortitude",
    "onset": [
      1,
      "days"
    ],
    "tags": {
      "creature": [
        "aberration",
        "elemental"
      ],
      "habitat": [
        "plains",
        "planar"
      ],
      "theme": [
        "disease",
        "corruption",
        "mutation"
      ],
      "origin": [
        "planar",
        "magical"
      ],
      "delivery": [
        "contact",
        "ability"
      ]
    },
    "virulent": true,
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "dazzled",
            null
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "clumsy",
            2
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "drained",
            3
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "paralyzed",
            null
          ],
          [
            "condition",
            "drained",
            3
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "worldblight",
    "rootHealing": "affliction-damage",
    "level": 17,
    "dc": 36,
    "rarity": "rare",
    "stat": "fortitude",
    "onset": [
      12,
      "hours"
    ],
    "tags": {
      "creature": [
        "plant",
        "fungus"
      ],
      "habitat": [
        "forest",
        "swamp"
      ],
      "theme": [
        "disease",
        "corruption",
        "fungal",
        "spores"
      ],
      "origin": [
        "primal",
        "magical"
      ],
      "delivery": [
        "contact",
        "inhaled"
      ]
    },
    "virulent": true,
    "stages": [
      [
        [
          12,
          "hours"
        ],
        [
          [
            "condition",
            "enfeebled",
            2
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          12,
          "hours"
        ],
        [
          [
            "condition",
            "enfeebled",
            3
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "damage",
            "3d6",
            "void"
          ]
        ],
        {}
      ],
      [
        [
          12,
          "hours"
        ],
        [
          [
            "condition",
            "enfeebled",
            3
          ],
          [
            "condition",
            "drained",
            3
          ],
          [
            "condition",
            "slowed",
            1
          ],
          [
            "damage",
            "4d6",
            "void"
          ]
        ],
        {
          "healing": "affliction-damage"
        }
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "paralyzed",
            null
          ],
          [
            "condition",
            "drained",
            4
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "death",
            "death-effect"
          ]
        ],
        {
          "expiry": "stay"
        }
      ]
    ]
  },
  {
    "slug": "pale-doom",
    "level": 20,
    "dc": 40,
    "rarity": "rare",
    "stat": "fortitude",
    "onset": [
      1,
      "hours"
    ],
    "tags": {
      "creature": [
        "undead",
        "spirit"
      ],
      "habitat": [
        "underground",
        "planar"
      ],
      "theme": [
        "disease",
        "necrotic",
        "corruption"
      ],
      "origin": [
        "undead",
        "planar"
      ],
      "delivery": [
        "aura",
        "contact"
      ]
    },
    "save": [
      "gm",
      "gmOnly"
    ],
    "identification": "suspected",
    "virulent": true,
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "enfeebled",
            2
          ]
        ],
        {
          "blockSpeak": true
        }
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "condition",
            "drained",
            3
          ],
          [
            "condition",
            "slowed",
            1
          ],
          [
            "damage",
            "4d6",
            "void"
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "condition",
            "paralyzed",
            null
          ],
          [
            "condition",
            "drained",
            4
          ],
          [
            "damage",
            "6d6",
            "void"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "death",
            "death-effect"
          ]
        ],
        {
          "expiry": "stay"
        }
      ]
    ]
  },
  {
    "slug": "sunscale-fever",
    "level": 6,
    "dc": 22,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": [
      1,
      "days"
    ],
    "tags": {
      "creature": [
        "animal",
        "humanoid"
      ],
      "family": [
        "reptile"
      ],
      "habitat": [
        "desert"
      ],
      "theme": [
        "disease"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "bite",
        "contact"
      ]
    },
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "fatigued",
            null
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "reef-rot",
    "level": 9,
    "dc": 26,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": [
      8,
      "hours"
    ],
    "tags": {
      "creature": [
        "animal"
      ],
      "family": [
        "fish",
        "shark"
      ],
      "habitat": [
        "aquatic",
        "coastal"
      ],
      "theme": [
        "disease"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "bite",
        "injury"
      ]
    },
    "stages": [
      [
        [
          12,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          12,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "clumsy",
            2
          ]
        ],
        {}
      ],
      [
        [
          12,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "clumsy",
            3
          ],
          [
            "condition",
            "enfeebled",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "sky-chill",
    "level": 10,
    "dc": 27,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": [
      4,
      "hours"
    ],
    "tags": {
      "creature": [
        "animal",
        "beast"
      ],
      "family": [
        "bird"
      ],
      "habitat": [
        "mountain"
      ],
      "theme": [
        "disease"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          12,
          "hours"
        ],
        [
          [
            "condition",
            "fatigued",
            null
          ]
        ],
        {}
      ],
      [
        [
          12,
          "hours"
        ],
        [
          [
            "condition",
            "fatigued",
            null
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          12,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ],
          [
            "condition",
            "confused",
            null
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "moonfen-ague",
    "level": 14,
    "dc": 32,
    "rarity": "rare",
    "stat": "will",
    "onset": [
      1,
      "days"
    ],
    "tags": {
      "creature": [
        "fey",
        "humanoid"
      ],
      "habitat": [
        "swamp",
        "forest"
      ],
      "theme": [
        "disease",
        "dream",
        "mental"
      ],
      "origin": [
        "primal",
        "occult"
      ],
      "delivery": [
        "aura",
        "contact"
      ]
    },
    "save": [
      "gm",
      "gmOnly"
    ],
    "identification": "hidden",
    "virulent": true,
    "stages": [
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ],
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "stupefied",
            3
          ],
          [
            "condition",
            "confused",
            null
          ]
        ],
        {}
      ],
      [
        [
          1,
          "days"
        ],
        [
          [
            "condition",
            "unconscious",
            null
          ],
          [
            "condition",
            "stupefied",
            4
          ]
        ],
        {}
      ]
    ]
  }
];

export const PLAGUES_PESTILENCE_DEFINITIONS = Object.freeze(SPECS.map(makeDefinition));
export function createPlaguesPestilenceDefinitions() { return PLAGUES_PESTILENCE_DEFINITIONS.map((definition) => structuredClone(definition)); }
export const PLAGUES_PESTILENCE_CONTENT_VERSION = CONTENT_VERSION;
export const PLAGUES_PESTILENCE_MODULE_ID = MODULE_ID;
