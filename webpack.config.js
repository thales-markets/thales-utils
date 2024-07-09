const path = require('path');
const { buffer } = require('stream/consumers');

module.exports = {
    entry: './index.ts',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: { stream: require.resolve('stream-browserify'), buffer: require.resolve('buffer/') },
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname),
        library: 'thalesUtils',
        libraryTarget: 'umd',
    },
};
