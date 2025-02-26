import { readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import { join, resourceDir, tempDir, appLocalDataDir } from '@tauri-apps/api/path';

// 默认API地址
const DEFAULT_API_URL = "https://shop.caolib.ggff.net";

// 获取配置文件路径
async function getConfigFilePath() {
    try {
        // 尝试使用应用资源目录
        const appResPath = await resourceDir();
        console.log('应用资源目录:', appResPath);

        // 创建配置文件路径
        const configPath = await join(appResPath, 'config.json');
        console.log('尝试使用配置文件路径:', configPath);

        // 测试资源目录是否可写
        try {
            const testFilePath = await join(appResPath, 'test.tmp');
            await writeTextFile(testFilePath, 'test');
            console.log('资源目录可写入:', appResPath);

            // 清理测试文件
            try {
                const { remove } = await import('@tauri-apps/plugin-fs');
                await remove(testFilePath);
            } catch (e) {
                console.log('清理测试文件失败，但不影响功能:', e);
            }

            // 资源目录可写，直接使用配置文件路径
            return configPath;
        } catch (writeError) {
            console.error('资源目录不可写入，尝试使用备用路径:', writeError);
            return await getFallbackConfigPath();
        }
    } catch (error) {
        console.error('获取资源目录路径失败，使用备用路径:', error);
        return await getFallbackConfigPath();
    }
}

// 获取备用配置文件路径
async function getFallbackConfigPath() {
    try {
        // 首先尝试使用本地数据目录
        const localDataPath = await appLocalDataDir();
        const configDirPath = await join(localDataPath, 'config');

        console.log('尝试使用备用配置目录:', configDirPath);

        const dirExists = await exists(configDirPath);
        if (!dirExists) {
            await mkdir(configDirPath, { recursive: true });
            console.log('创建备用配置目录成功:', configDirPath);
        }

        return await join(configDirPath, 'config.json');
    } catch (err) {
        console.error('本地数据目录也失败，使用临时目录:', err);

        // 如果还失败，再尝试临时目录
        return await getTempConfigPath();
    }
}

// 临时目录配置文件路径
async function getTempConfigPath() {
    try {
        const temp = await tempDir();
        const configDir = await join(temp, 'shop-web-admin-config');

        console.log('使用临时目录作为最终备用:', configDir);

        const dirExists = await exists(configDir);
        if (!dirExists) {
            await mkdir(configDir, { recursive: true });
        }

        return await join(configDir, 'config.json');
    } catch (err) {
        console.error('获取临时配置路径也失败:', err);
        // 最后的备用选项
        return 'config.json'; // 相对于应用当前目录
    }
}

// 获取所有配置信息
async function getConfig() {
    try {
        // 获取配置文件路径
        const configPath = await getConfigFilePath();
        console.log('最终使用配置文件路径:', configPath);

        // 检查文件是否存在
        const fileExists = await exists(configPath);

        // 如果文件不存在，创建一个默认的配置文件
        if (!fileExists) {
            console.log('配置文件不存在，创建默认配置文件');
            const defaultConfig = {
                urls: [DEFAULT_API_URL],
                currentUrl: DEFAULT_API_URL
            };
            try {
                await writeTextFile(configPath, JSON.stringify(defaultConfig, null, 2));
                console.log('成功创建默认配置文件');
                return defaultConfig;
            } catch (e) {
                console.error('创建配置文件失败:', e);
                // 如果无法写入，返回默认配置
                return defaultConfig;
            }
        }

        // 读取配置文件
        const content = await readTextFile(configPath);
        const config = JSON.parse(content);

        // 兼容旧版本配置
        if (!config.urls && config.baseURL) {
            return {
                urls: [config.baseURL],
                currentUrl: config.baseURL
            };
        }

        return {
            urls: config.urls || [],
            currentUrl: config.currentUrl || ''
        };
    } catch (error) {
        console.error('读取配置文件失败，使用默认值:', error);
        return {
            urls: [DEFAULT_API_URL],
            currentUrl: DEFAULT_API_URL
        };
    }
}

// 保存配置
async function saveConfig(config) {
    try {
        const configPath = await getConfigFilePath();
        await writeTextFile(configPath, JSON.stringify(config, null, 2));
        console.log('配置已更新成功');
        return true;
    } catch (error) {
        console.error('保存配置文件失败:', error);
        throw error;
    }
}

// 获取所有 URL 和当前选中的 URL
export async function getUrlConfig() {
    const config = await getConfig();
    return {
        urls: config.urls,
        currentUrl: config.currentUrl
    };
}

// 获取基础URL (兼容旧接口)
export async function getBaseURL() {
    const config = await getConfig();
    return config.currentUrl;
}

// 添加或更新 URL 配置
export async function updateUrlList(urls, currentUrl) {
    const config = await getConfig();
    config.urls = urls;
    config.currentUrl = currentUrl;
    return await saveConfig(config);
}

// 更新当前选中的 URL (兼容旧接口)
export async function updateConfig(newBaseURL) {
    const config = await getConfig();
    const urls = [...config.urls];

    // 如果新URL不在列表中，则添加
    if (!urls.includes(newBaseURL)) {
        urls.push(newBaseURL);
    }

    return await saveConfig({
        urls: urls,
        currentUrl: newBaseURL
    });
}

// 删除 URL
export async function deleteUrl(url) {
    const config = await getConfig();
    const index = config.urls.indexOf(url);

    if (index !== -1) {
        config.urls.splice(index, 1);

        // 如果删除的是当前选中的URL，则重置当前URL
        if (config.currentUrl === url) {
            config.currentUrl = config.urls.length > 0 ? config.urls[0] : '';
        }

        await saveConfig(config);
        return true;
    }

    return false;
}
