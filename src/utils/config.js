import { readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { BaseDirectory } from '@tauri-apps/plugin-fs';

// 配置文件将存储在AppConfig目录的config文件夹下
async function getConfigFilePath() {
    try {
        // 使用BaseDirectory.AppConfig作为基础目录，这通常是被Tauri默认允许访问的
        const configDirPath = await join('config');

        // 检查目录是否存在，不存在则创建
        const dirExists = await exists(configDirPath, { baseDir: BaseDirectory.AppConfig });
        if (!dirExists) {
            await mkdir(configDirPath, { recursive: true, baseDir: BaseDirectory.AppConfig });
            console.log('创建配置文件夹成功');
        }

        // 返回配置文件完整路径
        return await join(configDirPath, 'config.json');
    } catch (error) {
        console.error('获取配置文件路径失败:', error);
        throw error;
    }
}

// 获取所有配置信息
async function getConfig() {
    try {
        // 获取配置文件路径
        const configPath = await getConfigFilePath();
        // 检查文件是否存在
        const fileExists = await exists(configPath, { baseDir: BaseDirectory.AppConfig });
        // 如果文件不存在，创建一个默认的配置文件
        if (!fileExists) {
            console.log('配置文件不存在，创建默认配置文件');
            const defaultConfig = {
                urls: [],
                currentUrl: ''
            };
            await writeTextFile(configPath, JSON.stringify(defaultConfig, null, 2), { baseDir: BaseDirectory.AppConfig });
            return defaultConfig;
        }

        // 读取配置文件
        const content = await readTextFile(configPath, { baseDir: BaseDirectory.AppConfig });
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
        console.error('读取配置文件失败:', error);
        // 读取失败返回默认值
        return { urls: [], currentUrl: '' };
    }
}

// 保存配置
async function saveConfig(config) {
    try {
        const configPath = await getConfigFilePath();
        await writeTextFile(configPath, JSON.stringify(config, null, 2), { baseDir: BaseDirectory.AppConfig });
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
