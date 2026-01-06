import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import './Home.css';

// Default placeholder image for courts
const DEFAULT_COURT_IMAGE = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=250&fit=crop&auto=format';

export default function Home() {
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Search & Filter states
    const [search, setSearch] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch courts with filters
    const fetchCourts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (minPrice) params.append('minPrice', minPrice);
            if (maxPrice) params.append('maxPrice', maxPrice);
            
            const query = params.toString();
            const data = await api(`/courts${query ? `?${query}` : ''}`);
            setCourts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, minPrice, maxPrice]);

    useEffect(() => {
        fetchCourts();
    }, [fetchCourts]);

    // Clear all filters
    const clearFilters = () => {
        setSearch('');
        setMinPrice('');
        setMaxPrice('');
    };

    const hasFilters = search || minPrice || maxPrice;

    return (
        <div className="home-container">
            {/* Header Section */}
            <div className="home-header">
                <h2 className="home-title">🎾 Tìm sân Pickleball</h2>
                <p className="home-subtitle">Khám phá và đặt sân gần bạn</p>
            </div>

            {/* Search Section */}
            <div className="search-section">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm theo tên sân hoặc địa chỉ..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                    {search && (
                        <button className="clear-search" onClick={() => setSearch('')}>
                            ✕
                        </button>
                    )}
                </div>

                <button 
                    className={`filter-toggle ${showFilters ? 'active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <span>⚙️</span>
                    Bộ lọc
                    {hasFilters && <span className="filter-badge"></span>}
                </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="filter-panel">
                    <div className="filter-group">
                        <label>💰 Khoảng giá (đ/giờ)</label>
                        <div className="price-range">
                            <input
                                type="number"
                                placeholder="Từ"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                min={0}
                                step={50000}
                            />
                            <span className="range-separator">—</span>
                            <input
                                type="number"
                                placeholder="Đến"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                min={0}
                                step={50000}
                            />
                        </div>
                    </div>

                    {hasFilters && (
                        <button className="clear-filters" onClick={clearFilters}>
                            🗑️ Xóa bộ lọc
                        </button>
                    )}
                </div>
            )}

            {/* Results Info */}
            <div className="results-info">
                {loading ? (
                    <span>Đang tìm kiếm...</span>
                ) : (
                    <span>
                        Tìm thấy <strong>{courts.length}</strong> sân
                        {hasFilters && ' phù hợp'}
                    </span>
                )}
            </div>

            {/* Court Grid */}
            {loading ? (
                <div className="loading-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="court-card skeleton">
                            <div className="skeleton-image"></div>
                            <div className="skeleton-content">
                                <div className="skeleton-title"></div>
                                <div className="skeleton-text"></div>
                                <div className="skeleton-text short"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : courts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🏸</div>
                    <h3>Không tìm thấy sân nào</h3>
                    <p>Thử thay đổi từ khóa hoặc bộ lọc</p>
                    {hasFilters && (
                        <button className="clear-filters-btn" onClick={clearFilters}>
                            Xóa bộ lọc
                        </button>
                    )}
                </div>
            ) : (
                <div className="court-grid">
                    {courts.map(c => (
                        <Link to={`/court/${c.id}`} key={c.id} className="court-card">
                            <div className="card-image">
                                <img 
                                    src={c.imageUrl || DEFAULT_COURT_IMAGE} 
                                    alt={c.name}
                                    onError={(e) => { e.target.src = DEFAULT_COURT_IMAGE; }}
                                />
                                <div className="price-tag">
                                    {c.pricePerHour?.toLocaleString('vi-VN')}đ<span>/giờ</span>
                                </div>
                            </div>
                            <div className="card-content">
                                <h4>{c.name}</h4>
                                <div className="court-address">
                                    <span className="address-icon">📍</span>
                                    <span>{c.address}</span>
                                </div>
                                <div className="card-footer">
                                    <span className="view-detail">Xem chi tiết →</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
