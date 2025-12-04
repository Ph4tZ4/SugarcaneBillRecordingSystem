module.exports = {
    apps: [{
        name: "sugarcane-system",
        script: "./server/src/index.ts",
        interpreter: "npx",
        interpreter_args: "ts-node",
        env: {
            NODE_ENV: "production",
            PORT: 5001
        }
    }]
}
