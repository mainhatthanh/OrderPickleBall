import { db } from '../db.js';

export function listPublic(req, res) {
    const { search, minPrice, maxPrice } = req.query;
    
    let items = db.data.courts.filter(c => c.status === 'active');
    
    // Tìm kiếm theo tên hoặc địa chỉ
    if (search && search.trim()) {
        const keyword = search.trim().toLowerCase();
        items = items.filter(c => 
            c.name?.toLowerCase().includes(keyword) ||
            c.address?.toLowerCase().includes(keyword)
        );
    }
    
    // Lọc theo khoảng giá
    if (minPrice) {
        items = items.filter(c => c.pricePerHour >= Number(minPrice));
    }
    if (maxPrice) {
        items = items.filter(c => c.pricePerHour <= Number(maxPrice));
    }
    
    res.json(items);
}

export function detail(req, res) {
    const item = db.data.courts.find(c => c.id === req.params.id);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy sân' });
    if (item.status !== 'active') return res.status(403).json({ message: 'Sân chưa công khai' });
    res.json(item);
}