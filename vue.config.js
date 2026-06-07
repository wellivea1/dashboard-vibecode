module.exports = {
  // Configure project name:
  chainWebpack: config => {
    config
      .plugin('html')
      .tap(args => {
        args[0].title = 'Zeitlog';
        args[0].script_url = process.env.VUE_APP_SCRIPT_URL;
        return args;
      });
    config
      .performance
        .maxEntrypointSize(1e6)
        .maxAssetSize(1e6);
    config
      .module
        .rule('worker')
        .test(/worker\.js$/)
        .use('worker-loader')
          .loader('worker-loader')
      .end()
  },
  // Ignore hidden files:
  configureWebpack: {
    devServer: {
      watchOptions: {
        ignored: [/\/\./],
      },
    },
  },
  transpileDependencies: [
    'vuetify'
  ],
  // Allow the deploy workflow to override the base path (e.g. /dashboard-vibecode/
  // for this fork's GitHub Pages site) without editing this file:
  publicPath: process.env.VUE_APP_PUBLIC_PATH
  || (process.env.NODE_ENV === 'production' ? '/dashboard/' : './'),
  devServer: (
    process.env.VUE_APP_DEV_SERVER
    ? {
      disableHostCheck: true,
      public: process.env.VUE_APP_DEV_SERVER,
    }
    : undefined
  ),
}
