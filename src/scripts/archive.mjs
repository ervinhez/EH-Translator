#!/usr/bin/env zx

console.log(chalk.cyan("\nStarting compression tasks...\n"));

// 1. 进入 build 目录
cd("build");

// 2. 清理旧的 zip 文件
await $`npx shx rm -f *.zip`;

// 3. 打包 Chrome 扩展目录
await $`npx bestzip chrome.zip chrome`;

console.log(chalk.green("\n✅ All zip files created successfully."));
