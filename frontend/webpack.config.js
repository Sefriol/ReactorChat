module.exports = {
    entry: [
        './src','webpack/hot/dev-server' 
    ],
    output: {
        path: __dirname,
        publicPath: '/',
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel',
                query: {
                    presets: ['react', 'es2015', 'stage-1']
                }
            },
            {
                test: /\.woff2?$|\.ttf$|\.eot$|\.svg$/,
                loader: 'file?name=fonts/[hash:6].[ext]'
            },
            {
                test: /\.scss$/,
                loaders: ["style", "css", "sass"]
            }
        ]
    },
    devServer: {
        historyApiFallback: true,
        contentBase: './'
    },
    watchOptions: {
        poll: true
    },  
    externals: {
        jquery: 'jQuery',
        $: 'jQuery'
    },
};
