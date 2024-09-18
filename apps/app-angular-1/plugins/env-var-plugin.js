/**
 * Based on:
 * https://nx.dev/recipes/angular/use-environment-variables-in-angular#using-a-custom-esbuild-plugin
 */

const myOrgEnvRegex = /^PUBLIC_/i;

const envVarPlugin = {
  name: 'env-var-plugin',
  setup(build) {
    const options = build.initialOptions;

    const envVars = {};
    for (const key in process.env) {
      if (myOrgEnvRegex.test(key)) {
        console.log('key', key, process.env[key]);
        envVars[key] = process.env[key];
      }
    }

    options.define['process.env'] = JSON.stringify(envVars);
  },
};

module.exports = envVarPlugin;
