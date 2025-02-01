// 默认图片
const defaultImage = new URL('@/assets/img-error.png', import.meta.url).href;

// 图片加载失败,显示默认图片
const handleImageError = (e) => {
    e.target.src = defaultImage;
}


export { handleImageError } 