const kittyProjector = (storageRoot, resolvers) => {
  const cooldowns = storageRoot.get('cooldowns')

  return storageRoot
    .get('kitties')
    .selectFields(
      'index',
      'genes',
      'birthTime',
      'cooldownEndBlock',
      'matronId',
      'sireId',
      'siringWithId',
      'cooldownIndex',
      'generation',
    )
    .rename(['index', 'id'], ['matronId', 'matron'], ['sireId', 'sire'])
    // "over" accepts a key/path and a "function" to modify the value at that path.
    // We use the get function of the cooldowns wrapper to replace the cooldown
    // index with a duration. The "function" is actually just a DSL object that
    // represents lazy computation, so only "functions" generated through the
    // Graph Protocol APi should be passed in.
    .over('cooldownIndex', cooldowns.get)
    .rename(['cooldownIndex', 'cooldownDuration'])
}

export default {
  Kitty: kittyProjector,
}
