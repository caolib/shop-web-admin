import {
    BgColorsOutlined,
    CarOutlined,
    DesktopOutlined,
    HomeOutlined,
    MedicineBoxOutlined,
    MobileOutlined,
    ScissorOutlined,
    ShoppingOutlined,
    SkinOutlined,
    ThunderboltOutlined,
    UserOutlined,
} from '@ant-design/icons-vue'

const menuItems = [
    { key: 1, icon: ThunderboltOutlined, items: ['家用电器'] },
    { key: 2, icon: MobileOutlined, items: ['手机', '运营商', '数码'] },
    { key: 3, icon: DesktopOutlined, items: ['电脑', '办公', '文具用品'] },
    { key: 4, icon: HomeOutlined, items: ['家居', '家具', '家装', '厨具'] },
    { key: 5, icon: SkinOutlined, items: ['男装', '女装', '童装', '内衣'] },
    { key: 6, icon: ScissorOutlined, items: ['美妆', '个护清洁', '宠物'] },
    { key: 7, icon: ShoppingOutlined, items: ['女鞋', '箱包', '钟表', '珠宝'] },
    { key: 8, icon: UserOutlined, items: ['男鞋', '运动', '户外'] },
    { key: 9, icon: CarOutlined, items: ['房产', '汽车', '汽车用品'] },
    { key: 10, icon: MedicineBoxOutlined, items: ['母婴', '玩具乐器'] },
    { key: 11, icon: BgColorsOutlined, items: ['食品', '酒类', '生鲜', '特产'] },
]

export { menuItems };