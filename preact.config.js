export default (config, env, helpers) => {
  const { rule } = helpers.getLoadersByName(config, "babel")[0];
  const babelConfig = rule.options;
};
