import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Beer, DollarSign, BarChart3, Users, History, Save, AlertCircle, ChevronLeft, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Download, Gift, Wine, Calendar, ClipboardList, Zap, Droplet, Wifi, FileText, Archive, Percent, Settings, Edit3, Utensils, Bell, BellRing, X, User, Briefcase } from 'lucide-react';

// --- Local Storage Keys ---
const STORAGE_KEYS = {
    INVENTORY: 'nutshell_inventory',
    HISTORY: 'nutshell_product_history',
    SALES: 'nutshell_sales_log',
    GUESTS: 'nutshell_active_guests',
    EXPENSES: 'nutshell_expenses',
    MANUAL_MONTHLY: 'nutshell_manual_monthly',
    ADDONS: 'nutshell_addons',
    LAST_TAB: 'nutshell_last_tab'
};

// 預設雜支項目
const DEFAULT_EXPENSE_CATEGORIES = ['水費', '電費', '網路費', '店租', '耗材', '其他'];

// 預設初始客製選項
const DEFAULT_ADDONS = [
  { id: 'patty', name: '加漢堡排', price: 60 },
  { id: 'cheese', name: '加起司', price: 20 },
  { id: 'bacon', name: '加培根', price: 30 },
  { id: 'egg', name: '加蛋', price: 15 },
];

// --- Local Storage Helper Functions ---
const loadData = (key, defaultValue = []) => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
        console.error(`Error loading data for ${key}:`, e);
        return defaultValue;
    }
};

const saveData = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Error saving data for ${key}:`, e);
    }
};

export default function App() {
  // --- 資料狀態 ---
  const [inventory, setInventory] = useState(() => loadData(STORAGE_KEYS.INVENTORY));
  const [productHistory, setProductHistory] = useState(() => loadData(STORAGE_KEYS.HISTORY));
  const [salesLog, setSalesLog] = useState(() => loadData(STORAGE_KEYS.SALES)); 
  const [manualMonthlyData, setManualMonthlyData] = useState(() => loadData(STORAGE_KEYS.MANUAL_MONTHLY));
  const [expenses, setExpenses] = useState(() => loadData(STORAGE_KEYS.EXPENSES)); 
  const [activeGuests, setActiveGuests] = useState(() => loadData(STORAGE_KEYS.GUESTS)); 
  const [addons, setAddons] = useState(() => loadData(STORAGE_KEYS.ADDONS, DEFAULT_ADDONS)); 

  // --- 頁面狀態 ---
  const [activeTab, setActiveTab] = useState(() => loadData(STORAGE_KEYS.LAST_TAB, 'pos'));
  const [statsSubTab, setStatsSubTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(null);
  
  // --- 操作狀態 ---
  const [selectedGuestId, setSelectedGuestId] = useState(null); 
  const [newGuestName, setNewGuestName] = useState(''); 
  const [newGuestType, setNewGuestType] = useState('guest'); // 'guest' | 'tasting'
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', brand: '', style: '', cost: '', price: '', stock: '', isKeg: false, category: 'drink' });
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(''); 
  const [newExpense, setNewExpense] = useState({ category: '其他', amount: '', date: new Date().toISOString().split('T')[0], note: '' });
  const [customCategory, setCustomCategory] = useState('');

  // --- Modal 狀態 ---
  const [foodModal, setFoodModal] = useState({ isOpen: false, item: null, addons: [] });
  const [addonManageModal, setAddonManageModal] = useState(false);
  const [newAddon, setNewAddon] = useState({ name: '', price: '' });
  const [addCostModal, setAddCostModal] = useState({ isOpen: false, item: null, amount: '' });
  const [dateEditModal, setDateEditModal] = useState({ isOpen: false, item: null, newDate: '' });

  // --- UI 狀態 ---
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDanger: false });
  const [toast, setToast] = useState(null); 
  const [expandedDates, setExpandedDates] = useState({});
  const [expandedTrans, setExpandedTrans] = useState({});
  const [manualEntry, setManualEntry] = useState({ month: '', profit: '' });

  // --- Local Storage Effect ---
  useEffect(() => saveData(STORAGE_KEYS.INVENTORY, inventory), [inventory]);
  useEffect(() => saveData(STORAGE_KEYS.HISTORY, productHistory), [productHistory]);
  useEffect(() => saveData(STORAGE_KEYS.SALES, salesLog), [salesLog]);
  useEffect(() => saveData(STORAGE_KEYS.GUESTS, activeGuests), [activeGuests]);
  useEffect(() => saveData(STORAGE_KEYS.EXPENSES, expenses), [expenses]);
  useEffect(() => saveData(STORAGE_KEYS.MANUAL_MONTHLY, manualMonthlyData), [manualMonthlyData]);
  useEffect(() => saveData(STORAGE_KEYS.ADDONS, addons), [addons]);
  useEffect(() => saveData(STORAGE_KEYS.LAST_TAB, activeTab), [activeTab]);

  // --- UI Helper Functions ---
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const toggleDate = (date) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const toggleTrans = (id) => {
    setExpandedTrans(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return ''; 
    return date.toLocaleString('zh-TW', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  };

  const toLocalISOString = (dateString) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return ''; 
      const pad = (num) => (num < 10 ? '0' : '') + num;
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
        showToast('沒有資料可匯出', 'error');
        return;
    }
    const csvContent = "\uFEFF" + [
      Object.keys(data[0] || {}).join(","), 
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  // 新增：專門匯出庫存的功能 (轉中文標題)
  const handleExportInventory = () => {
    const dataToExport = inventory.map(item => ({
        '名稱': item.name,
        '品牌': item.brand || '',
        '類別': item.category === 'food' ? '餐點' : '飲品',
        '形式': item.isKeg ? (item.category === 'food' ? '批次餐點' : '桶裝生啤') : '瓶裝/單份',
        '風格/備註': item.style || '',
        '成本': item.cost,
        '售價': item.price,
        '庫存數量': item.isKeg ? (item.stock > 0 ? '供應中' : '已用盡') : item.stock,
        '已售份數(批次)': item.glassesSold || 0,
        '累積營收(批次)': item.kegRevenue || 0,
        '入庫時間': formatDate(item.createdAt),
        '開桶/開賣時間': item.openedAt ? formatDate(item.openedAt) : ''
    }));
    exportToCSV(dataToExport, 'inventory_status');
    showToast('庫存表已匯出');
  };

  // 分類庫存
  const bottleInventory = inventory.filter(i => !i.isKeg && (!i.category || i.category === 'drink'));
  const kegInventory = inventory.filter(i => i.isKeg && (!i.category || i.category === 'drink'));
  const foodInventory = inventory.filter(i => i.category === 'food');

  // --- 資料計算邏輯 ---
  const groupedSales = useMemo(() => {
    const groups = {}; 
    salesLog.forEach(sale => {
      let dateStr = sale.date || (sale.timestamp ? sale.timestamp.split(' ')[0] : 'Unknown'); 
      const transId = sale.transactionId || `${sale.timestamp}-${sale.customerName}`;

      if (!groups[dateStr]) groups[dateStr] = { date: dateStr, totalRevenue: 0, transactions: {} };
      
      if (!groups[dateStr].transactions[transId]) {
        groups[dateStr].transactions[transId] = {
          id: transId,
          customerName: sale.customerName || '一般客',
          time: sale.timestamp ? (sale.timestamp.split(' ')[1] || sale.timestamp) : '', 
          total: 0, profit: 0, items: []
        };
      }
      const trans = groups[dateStr].transactions[transId];
      trans.total += sale.price;
      trans.profit += sale.profit;
      trans.items.push(sale);
      groups[dateStr].totalRevenue += sale.price;
    });
    return Object.values(groups)
      .sort((a, b) => {
        if (a.date === 'Unknown') return 1;
        if (b.date === 'Unknown') return -1;
        return new Date(b.date) - new Date(a.date);
      })
      .map(dateGroup => ({
        ...dateGroup,
        transactions: Object.values(dateGroup.transactions).sort((a, b) => b.id - a.id)
      }));
  }, [salesLog]);

  const monthlyData = useMemo(() => {
    const stats = {};
    salesLog.forEach(sale => {
      if(!sale.timestamp) return;
      const date = new Date(sale.timestamp); 
      if (isNaN(date.getTime())) return; // 防呆
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!stats[monthKey]) stats[monthKey] = { month: monthKey, revenue: 0, profit: 0, source: 'system' };
      stats[monthKey].revenue += sale.price;
      stats[monthKey].profit += sale.profit;
    });
    expenses.forEach(exp => {
      if(!exp.date) return;
      const date = new Date(exp.date);
      if (isNaN(date.getTime())) return; // 防呆
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (stats[monthKey]) {
          if(!stats[monthKey].profit) stats[monthKey].profit = 0;
          stats[monthKey].profit -= exp.amount;
      }
    });
    manualMonthlyData.forEach(entry => {
      const monthEntryKey = entry.month;
      if (!stats[monthEntryKey]) {
        stats[monthEntryKey] = { month: monthEntryKey, revenue: 0, profit: 0, source: 'manual' };
      }
      stats[monthEntryKey].profit += Number(entry.profit);
    });
    return Object.values(stats)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [salesLog, manualMonthlyData, expenses]);

  const dailyStats = useMemo(() => {
    if (!selectedMonth) return [];
    const days = {};
    
    salesLog.forEach(sale => {
        if (!sale.timestamp) return;
        const dateObj = new Date(sale.timestamp);
        if (isNaN(dateObj.getTime())) return; // 防呆
        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthKey === selectedMonth) {
            const dayKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
            if (!days[dayKey]) days[dayKey] = { date: dayKey, revenue: 0, profit: 0, count: 0 };
            
            days[dayKey].revenue += sale.price;
            days[dayKey].profit += sale.profit;
            days[dayKey].count += 1;
        }
    });

    expenses.forEach(exp => {
        if (!exp.date) return;
        if (exp.date.startsWith(selectedMonth)) {
             if (!days[exp.date]) days[exp.date] = { date: exp.date, revenue: 0, profit: 0, count: 0 };
             days[exp.date].profit -= exp.amount;
        }
    });

    return Object.values(days).sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedMonth, salesLog, expenses]);

  // --- 業務邏輯 ---
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;
    const isBatchMode = newItem.isKeg || newItem.category === 'food';
    const itemData = {
      id: Date.now(), name: newItem.name, brand: newItem.brand || '', 
      style: newItem.style || (newItem.category === 'food' ? 'Food' : 'Lager'),
      cost: Number(newItem.cost) || 0, price: Number(newItem.price) || 0,
      stock: isBatchMode ? 1 : (Number(newItem.stock) || 0), isKeg: isBatchMode,
      category: newItem.category || 'drink', kegRevenue: 0, glassesSold: 0, createdAt: new Date().toISOString()
    };
    setInventory(prev => [...prev, itemData]);
    const historyExists = productHistory.some(h => h.name === itemData.name);
    if (!historyExists) {
        setProductHistory(prev => [...prev, { 
            id: Date.now(), 
            name: itemData.name, 
            brand: itemData.brand, 
            style: itemData.style, 
            isKeg: itemData.isKeg, 
            category: itemData.category 
        }]);
    }
    
    setNewItem(prev => ({
        ...prev,
        name: '',
        cost: '',
        price: '',
        stock: '',
    }));
    
    showToast('已新增商品 (可繼續輸入)');
  };

  const handleRestockHistoryItem = (historyItemName) => {
    const historyItem = productHistory.find(i => i.name === historyItemName);
    if (historyItem) {
      setNewItem({ 
        ...newItem, 
        name: historyItem.name, 
        brand: historyItem.brand || '', 
        style: historyItem.style || '', 
        cost: historyItem.cost || '',   
        price: historyItem.price || '', 
        isKeg: historyItem.isKeg || false, 
        category: historyItem.category || 'drink'
      });
    }
  };

  const handleDeleteItem = (id) => {
    setConfirmModal({
      isOpen: true, title: '刪除品項', message: '確定要從目前庫存中刪除嗎？', isDanger: true,
      onConfirm: () => {
        setInventory(prev => prev.filter(item => item.id !== id));
        showToast('品項已移除', 'success');
        closeConfirm();
      }
    });
  };

  const handleFinishBatch = (item) => {
    const finalProfit = item.kegRevenue - item.cost;
    const itemTypeLabel = item.category === 'food' ? '餐點批次' : '生啤桶';
    setConfirmModal({
      isOpen: true, title: `結算${itemTypeLabel}`,
      message: `確定要結束「${item.name}」嗎？\n\n📊 數據統計：\n總投入成本：$${item.cost}\n總營收：$${item.kegRevenue}\n共售出：${item.glassesSold} 份\n\n💰 最終損益：${finalProfit >= 0 ? '+' : ''}$${finalProfit}`,
      isDanger: true,
      onConfirm: () => {
        const costRecord = {
            transactionId: Date.now(), itemId: item.id, name: `${item.name} (結算損益)`, customerName: '系統結算',
            type: 'keg_cost', profit: finalProfit, price: 0, date: new Date().toLocaleDateString(), timestamp: new Date().toLocaleString()
        };
        setSalesLog(prev => [...prev, costRecord]);
        setInventory(prev => prev.filter(i => i.id !== item.id));
        showToast(`${itemTypeLabel}已結算，損益 ${finalProfit}`, finalProfit >= 0 ? 'success' : 'error');
        closeConfirm();
      }
    });
  };

  const handleAddCost = () => {
    if (!addCostModal.item || !addCostModal.amount) return;
    const addedAmount = Number(addCostModal.amount);
    setInventory(prev => prev.map(item => 
        item.id === addCostModal.item.id ? { ...item, cost: (item.cost || 0) + addedAmount } : item
    ));
    showToast(`已追加成本 $${addedAmount}`);
    setAddCostModal({ isOpen: false, item: null, amount: '' });
  };

  const handleUpdateItemDate = () => {
      if (!dateEditModal.item || !dateEditModal.newDate) return;
      setInventory(prev => prev.map(item => 
        item.id === dateEditModal.item.id ? { ...item, openedAt: new Date(dateEditModal.newDate).toISOString() } : item
      ));
      showToast('時間已更新');
      setDateEditModal({ isOpen: false, item: null, newDate: '' });
  };

  const handleAddAddon = () => {
      if (!newAddon.name || !newAddon.price) return;
      setAddons(prev => [...prev, { id: Date.now(), name: newAddon.name, price: Number(newAddon.price) }]);
      setNewAddon({ name: '', price: '' });
      showToast('已新增客製選項');
  };

  const handleDeleteAddon = (id) => {
      if(window.confirm('確定刪除此選項？')) {
          setAddons(prev => prev.filter(addon => addon.id !== id));
          showToast('選項已刪除');
      }
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.amount) return;
    const expenseData = {
      id: Date.now(), category: newExpense.category === 'custom' ? customCategory : newExpense.category,
      amount: Number(newExpense.amount), date: newExpense.date, note: newExpense.note, createdAt: new Date().toISOString()
    };
    setExpenses(prev => [...prev, expenseData]);
    setNewExpense({ category: '其他', amount: '', date: new Date().toISOString().split('T')[0], note: '' });
    setCustomCategory('');
    showToast('已新增支出紀錄');
  };

  const handleDeleteExpense = (id) => {
    if(window.confirm('確定刪除此筆支出？')) {
        setExpenses(prev => prev.filter(exp => exp.id !== id));
        showToast('支出已刪除');
    }
  };

  const handleAddGuest = () => {
    if (!newGuestName.trim()) return;
    const newGuest = {
      id: Date.now(), 
      name: newGuestName, 
      type: newGuestType, // 'guest' or 'tasting'
      items: [], 
      discount: 0, 
      startTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      createdAt: new Date().toISOString()
    };
    setActiveGuests(prev => [...prev, newGuest]);
    setNewGuestName('');
    setNewGuestType('guest'); // Reset to default
    showToast(`已新增客人：${newGuest.name}`);
  };

  const handleItemClick = (item) => {
    if (item.category === 'food') { setFoodModal({ isOpen: true, item: item, addons: [] }); } else { handleAddToTab(item); }
  };

  const handleConfirmFood = () => {
    if (!foodModal.item) return;
    const addonsTotal = foodModal.addons.reduce((sum, addon) => sum + addon.price, 0);
    const finalPrice = foodModal.item.price + addonsTotal;
    const foodItem = {
      ...foodModal.item, price: finalPrice, originalPrice: foodModal.item.price,
      selectedAddons: foodModal.addons, served: false,
    };
    handleAddToTab(foodItem);
    setFoodModal({ isOpen: false, item: null, addons: [] });
  };

  const toggleAddon = (addon) => {
    const exists = foodModal.addons.find(a => a.id === addon.id);
    if (exists) { setFoodModal(prev => ({ ...prev, addons: prev.addons.filter(a => a.id !== addon.id) })); } else { setFoodModal(prev => ({ ...prev, addons: [...prev.addons, addon] })); }
  };

  const handleAddToTab = (item) => {
    if (!item.isKeg && item.stock <= 0) { showToast('庫存不足！無法加入', 'error'); return; }
    if (!item.isKeg) {
      setInventory(prev => prev.map(i => i.id === item.id ? { ...i, stock: i.stock - 1 } : i));
    }
    
    setActiveGuests(prev => prev.map(guest => {
        if (guest.id === selectedGuestId) {
            // 如果客人是「試酒」類型，預設商品為「試酒」狀態
            const defaultType = guest.type === 'tasting' ? 'tasting' : 'sale';
            const updatedItems = [...guest.items, { ...item, orderId: Date.now(), type: defaultType }];
            return { ...guest, items: updatedItems };
        }
        return guest;
    }));
  };

  // 只切換 Sale / Tasting (移除 Treat，Treat 由獨立按鈕控制)
  const toggleItemType = (guestId, orderId) => {
    setActiveGuests(prev => prev.map(guest => {
        if (guest.id === guestId) {
            const newItems = guest.items.map(item => {
              if (item.orderId === orderId) {
                // 如果目前是招待，切換此按鈕只會把它變回一般或試酒，不會切換招待
                // 簡單邏輯：在 Sale 和 Tasting 之間切換
                const nextType = item.type === 'sale' ? 'tasting' : 'sale';
                return { ...item, type: nextType };
              }
              return item;
            });
            return { ...guest, items: newItems };
        }
        return guest;
    }));
  };

  // 獨立切換 招待 狀態
  const toggleTreat = (guestId, orderId) => {
      setActiveGuests(prev => prev.map(guest => {
        if (guest.id === guestId) {
            const newItems = guest.items.map(item => {
              if (item.orderId === orderId) {
                // 如果目前是招待，取消招待回到該客人預設狀態(sale or tasting)
                // 如果目前不是招待，設為招待
                if (item.type === 'treat') {
                    // 回復邏輯：如果是試酒客人，回復為 tasting，否則 sale
                    return { ...item, type: guest.type === 'tasting' ? 'tasting' : 'sale' };
                } else {
                    return { ...item, type: 'treat' };
                }
              }
              return item;
            });
            return { ...guest, items: newItems };
        }
        return guest;
      }));
  };

  const toggleServedStatus = (guestId, orderId) => {
    setActiveGuests(prev => prev.map(guest => {
        if (guest.id === guestId) {
            const newItems = guest.items.map(item => {
              if (item.orderId === orderId) { return { ...item, served: !item.served }; }
              return item;
            });
            return { ...guest, items: newItems };
        }
        return guest;
    }));
  };

  const updateDiscount = (guestId, amount) => {
    setActiveGuests(prev => prev.map(guest => guest.id === guestId ? { ...guest, discount: Number(amount) || 0 } : guest));
  };

  const handleRemoveFromTab = (guestId, orderId, itemId) => {
    const targetItem = inventory.find(i => i.id === itemId);
    if (targetItem && !targetItem.isKeg) {
      setInventory(prev => prev.map(i => i.id === itemId ? { ...i, stock: i.stock + 1 } : i));
    }
    setActiveGuests(prev => prev.map(guest => {
        if (guest.id === guestId) {
            const newItems = guest.items.filter(item => item.orderId !== orderId);
            return { ...guest, items: newItems };
        }
        return guest;
    }));
  };

  const handleCheckout = (guest) => {
    if (guest.items.length === 0) {
        setActiveGuests(prev => prev.filter(g => g.id !== guest.id));
        setSelectedGuestId(null);
        return;
    }

    const calculateItemFinancials = (item) => {
      if (item.type === 'tasting' || item.type === 'treat') {
        if (item.isKeg) return { price: 0, profit: 0 }; 
        return { price: 0, profit: -item.cost };
      }
      if (item.isKeg) return { price: item.price, profit: 0 }; // 修正: 批次商品(餐點/生啤)在交易時不計算損益，只計營收
      return { price: item.price, profit: item.price - item.cost };
    };

    const subtotal = guest.items.reduce((sum, i) => {
      const { price } = calculateItemFinancials(i);
      return sum + price;
    }, 0);

    // 計算這張單因為試酒/招待總共扣除了多少成本
    const totalCostDeduction = guest.items.reduce((sum, i) => {
      if ((i.type === 'tasting' || i.type === 'treat') && !i.isKeg) {
        return sum + i.cost;
      }
      return sum;
    }, 0);
    
    const discount = guest.discount || 0;

    setConfirmModal({
      isOpen: true, title: '確認結帳收款',
      message: `客人：${guest.name}\n小計：$${subtotal}\n折扣：-$${discount}\n--------------\n應收總額：$${Math.max(0, subtotal - discount)}\n\n包含 ${guest.items.filter(i => i.type !== 'sale').length} 項招待/試酒\n(預計於淨利中扣除成本: $${totalCostDeduction})`,
      isDanger: false,
      onConfirm: () => {
        const transactionId = Date.now();
        const dateStr = new Date().toLocaleDateString();
        const fullTimestamp = new Date().toLocaleString();
        let newInventory = [...inventory];
        let newSalesLog = [...salesLog];
        const batchUpdates = {};
        guest.items.forEach(item => {
            if (item.isKeg && item.type === 'sale') {
                if (!batchUpdates[item.id]) batchUpdates[item.id] = { revenue: 0, count: 0 };
                batchUpdates[item.id].revenue += item.price;
                batchUpdates[item.id].count += 1;
            }
        });
        newInventory = newInventory.map(invItem => {
            if (batchUpdates[invItem.id]) {
                const update = batchUpdates[invItem.id];
                return { ...invItem, kegRevenue: (invItem.kegRevenue || 0) + update.revenue, glassesSold: (invItem.glassesSold || 0) + update.count };
            }
            return invItem;
        });
        setInventory(newInventory);
        for (const item of guest.items) {
            const { price, profit } = calculateItemFinancials(item);
            const saleRecord = {
                transactionId, itemId: item.id, name: item.name + (item.selectedAddons?.length ? ` (+${item.selectedAddons.map(a=>a.name).join(',')})` : ''),
                customerName: guest.name, type: item.type || 'sale', profit, price, date: dateStr, timestamp: fullTimestamp
            };
            newSalesLog.push(saleRecord);
        }
        if (discount > 0) {
           const discountRecord = {
                transactionId, itemId: 'discount', name: '整單折扣', customerName: guest.name,
                type: 'discount', profit: -discount, price: -discount, date: dateStr, timestamp: fullTimestamp
            };
            newSalesLog.push(discountRecord);
        }
        setSalesLog(newSalesLog);
        setActiveGuests(prev => prev.filter(g => g.id !== guest.id));
        setSelectedGuestId(null);
        showToast(`結帳完成！`, 'success');
        closeConfirm();
      }
    });
  };

  const handleCancelTab = (guest) => {
    setConfirmModal({
      isOpen: true, title: '刪除整張訂單', message: `確定要刪除 ${guest.name} 的訂單嗎？\n所有商品將自動退回庫存。`, isDanger: true,
      onConfirm: () => {
        const itemCounts = {};
        guest.items.forEach(item => { if (!item.isKeg) { itemCounts[item.id] = (itemCounts[item.id] || 0) + 1; } });
        let newInventory = [...inventory];
        for (const [itemId, count] of Object.entries(itemCounts)) {
             newInventory = newInventory.map(i => i.id === Number(itemId) ? { ...i, stock: i.stock + count } : i);
        }
        setInventory(newInventory);
        setActiveGuests(prev => prev.filter(g => g.id !== guest.id));
        setSelectedGuestId(null);
        showToast('訂單已刪除', 'success');
        closeConfirm();
      }
    });
  };

  const handleAddManualEntry = (e) => {
    e.preventDefault();
    if(!manualEntry.month || !manualEntry.profit) return;
    const existing = manualMonthlyData.find(d => d.month === manualEntry.month);
    if (existing) {
      if(window.confirm('該月份已有手動紀錄，要覆蓋嗎？')) {
        setManualMonthlyData(prev => prev.map(entry => entry.month === manualEntry.month ? { ...entry, profit: Number(manualEntry.profit) } : entry));
      }
    } else {
        setManualMonthlyData(prev => [...prev, { month: manualEntry.month, profit: Number(manualEntry.profit), id: Date.now() }]);
    }
    setManualEntry({ month: '', profit: '' });
    showToast('月報表資料已更新');
  };

  // --- 計算總計 ---
  const totalInventoryValue = inventory.reduce((acc, item) => acc + (item.cost * item.stock), 0);
  const totalRevenue = salesLog.reduce((acc, sale) => acc + (sale.price || 0), 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalRealizedProfit = salesLog.reduce((acc, sale) => acc + sale.profit, 0) - totalExpenses;
  
  const currentGuest = activeGuests.find(g => g.id === selectedGuestId);
  const currentGuestSubtotal = currentGuest ? currentGuest.items.reduce((sum, item) => {
     return sum + (item.type === 'tasting' || item.type === 'treat' ? 0 : item.price);
  }, 0) : 0;
  const currentGuestTotal = Math.max(0, currentGuestSubtotal - (currentGuest?.discount || 0));

  const maxMonthlyProfit = Math.max(...monthlyData.map(m => m.profit), 100);
  const displayAddons = addons.length > 0 ? addons : DEFAULT_ADDONS;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans pb-24 relative overflow-hidden">
      
      {/* Toast & Modal */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle size={18}/> : <CheckCircle size={18}/>}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gray-800 w-4/5 max-w-sm rounded-2xl p-6 border border-gray-700 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              {confirmModal.isDanger ? <AlertTriangle size={24} className="text-red-400"/> : <DollarSign size={24} className="text-green-400"/>}
              <h3 className="text-xl font-bold text-white whitespace-pre-line">{confirmModal.title}</h3>
            </div>
            <p className="text-gray-300 mb-6 whitespace-pre-line leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={closeConfirm} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold">取消</button>
              <button onClick={confirmModal.onConfirm} className={`flex-1 text-white py-3 rounded-xl font-bold shadow-lg ${confirmModal.isDanger ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>確認</button>
            </div>
          </div>
        </div>
      )}

      {/* 修改時間 Modal */}
      {dateEditModal.isOpen && dateEditModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-gray-800 w-4/5 max-w-sm rounded-2xl p-6 border border-gray-700 shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-2">調整開桶時間</h3>
                <p className="text-sm text-gray-400 mb-4">請選擇正確的開桶日期與時間：</p>
                <input type="datetime-local" className="w-full bg-gray-900 border border-gray-600 p-3 rounded text-white text-lg outline-none mb-4" value={dateEditModal.newDate} onChange={e=>setDateEditModal({...dateEditModal, newDate: e.target.value})}/>
                <div className="flex gap-2">
                    <button onClick={() => setDateEditModal({isOpen:false, item:null, newDate:''})} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded font-bold">取消</button>
                    <button onClick={handleUpdateItemDate} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded font-bold">確認更新</button>
                </div>
            </div>
        </div>
      )}

      {/* 餐點客製化 Modal */}
      {foodModal.isOpen && foodModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gray-800 w-4/5 max-w-sm rounded-2xl p-6 border border-gray-700 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4"><Utensils size={24} className="text-amber-500"/><h3 className="text-xl font-bold text-white">客製化 {foodModal.item.name}</h3></div>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                <p className="text-sm text-gray-400">請選擇加購項目：</p>
                {displayAddons.map(addon => {
                    const isSelected = foodModal.addons.some(a => a.id === addon.id);
                    return (
                        <button key={addon.id} onClick={() => toggleAddon(addon)} className={`w-full flex justify-between items-center p-3 rounded-lg border transition-all ${isSelected ? 'bg-amber-900/30 border-amber-500 text-amber-100' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>
                            <span>{addon.name}</span><span className="font-mono">+${addon.price}</span>
                        </button>
                    );
                })}
            </div>
            <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                <div className="text-white font-bold text-lg">總價: ${foodModal.item.price + foodModal.addons.reduce((s,a)=>s+a.price, 0)}</div>
                <div className="flex gap-2">
                     <button onClick={() => setFoodModal({isOpen: false, item: null, addons: []})} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg">取消</button>
                     <button onClick={handleConfirmFood} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-bold">確認加入</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* 管理客製選項 Modal */}
      {addonManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-gray-800 w-4/5 max-w-sm rounded-2xl p-6 border border-gray-700 shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Settings size={18}/> 管理客製選項</h3>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {displayAddons.map(addon => (
                        <div key={addon.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                            <span className="text-gray-200 text-sm">{addon.name} (+${addon.price})</span>
                            <button onClick={() => handleDeleteAddon(addon.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14}/></button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 mb-6">
                    <input placeholder="名稱" className="flex-1 bg-gray-900 border border-gray-600 p-2 rounded text-white text-sm outline-none" value={newAddon.name} onChange={e=>setNewAddon({...newAddon, name: e.target.value})}/>
                    <input type="number" placeholder="$" className="w-16 bg-gray-900 border border-gray-600 p-2 rounded text-white text-sm outline-none" value={newAddon.price} onChange={e=>setNewAddon({...newAddon, price: e.target.value})}/>
                    <button onClick={handleAddAddon} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded"><Plus size={16}/></button>
                </div>
                <button onClick={() => setAddonManageModal(false)} className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 rounded font-bold">關閉</button>
            </div>
        </div>
      )}

      {/* 增加成本 Modal */}
      {addCostModal.isOpen && addCostModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-gray-800 w-4/5 max-w-sm rounded-2xl p-6 border border-gray-700 shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-2">追加成本：{addCostModal.item.name}</h3>
                <p className="text-sm text-gray-400 mb-4">請輸入本次追加的金額（例如：補貨生菜 $200）</p>
                <input type="number" placeholder="金額 $" autoFocus className="w-full bg-gray-900 border border-gray-600 p-3 rounded text-white text-lg outline-none mb-4" value={addCostModal.amount} onChange={e=>setAddCostModal({...addCostModal, amount: e.target.value})}/>
                <div className="flex gap-2">
                    <button onClick={() => setAddCostModal({isOpen:false, item:null, amount:''})} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded font-bold">取消</button>
                    <button onClick={handleAddCost} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded font-bold">確認增加</button>
                </div>
            </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-amber-600 p-4 shadow-lg sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <h1 className="text-xl font-bold flex items-center gap-2 text-white"><Beer className="w-6 h-6" />殼 Nutshell.tw</h1>
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-green-900 text-green-200"><span className="font-bold">本機儲存</span></div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        
        {/* TAB: POS */}
        {activeTab === 'pos' && (
          <div className="space-y-4">
            {!selectedGuestId && (
              <div className="animate-in fade-in slide-in-from-left-4">
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-4 shadow-lg">
                  <h2 className="text-gray-400 text-sm mb-3 font-bold">接待新客人</h2>
                  <div className="flex gap-2">
                    <div className="w-1/3">
                        <select 
                            className="w-full h-full bg-gray-900 border border-gray-600 p-2 rounded-lg text-white text-sm outline-none focus:border-amber-500"
                            value={newGuestType}
                            onChange={(e) => {
                                const type = e.target.value;
                                setNewGuestType(type);
                                if (type === 'tasting') {
                                    setNewGuestName('自己');
                                } else {
                                    setNewGuestName('');
                                }
                            }}
                        >
                            <option value="guest">一般客</option>
                            <option value="tasting">試酒/業務</option>
                        </select>
                    </div>
                    <input type="text" placeholder="輸入名字/桌號" className="flex-1 bg-gray-900 border border-gray-600 p-3 rounded-lg text-white outline-none focus:border-amber-500" value={newGuestName} onChange={e => setNewGuestName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddGuest()}/>
                    <button onClick={handleAddGuest} className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-4 rounded-lg flex items-center shadow-lg"><Plus size={20} /></button>
                  </div>
                </div>
                <h2 className="text-gray-400 text-sm mb-2 font-bold flex justify-between"><span>營業中 ({activeGuests.length} 組)</span></h2>
                <div className="grid gap-3">
                  {activeGuests.length === 0 ? (
                    <div className="text-center py-10 text-gray-600 border-2 border-dashed border-gray-700 rounded-xl">目前沒有客人，請先開單</div>
                  ) : (
                    activeGuests.map(guest => {
                      const subtotal = guest.items.reduce((sum, i) => sum + (i.type === 'tasting' || i.type === 'treat' ? 0 : i.price), 0);
                      const total = Math.max(0, subtotal - (guest.discount || 0));
                      return (
                        <button key={guest.id} onClick={() => setSelectedGuestId(guest.id)} className="bg-gray-800 hover:bg-gray-750 p-4 rounded-xl border border-gray-700 flex justify-between items-center group active:scale-95 transition-all shadow-sm">
                          <div className="text-left">
                            <div className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                                {guest.name}
                                {guest.type === 'tasting' && <span className="text-[10px] bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded-full flex items-center gap-1"><Briefcase size={10}/> 試酒</span>}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                {guest.startTime} 入座 • {guest.items.length} 項
                                {guest.items.some(i => i.category === 'food' && !i.served) && <Utensils size={12} className="text-amber-500 ml-1" />}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-mono font-bold text-green-400">${total}</div>
                            <div className="text-xs text-gray-500">未結帳</div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {selectedGuestId && currentGuest && (
              <div className="animate-in slide-in-from-right-4 h-[calc(100vh-200px)] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setSelectedGuestId(null)} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm bg-gray-800 px-3 py-1.5 rounded-lg"><ChevronLeft size={18} /> 返回</button>
                  <div className="font-bold text-lg text-white flex items-center gap-2">
                      {currentGuest.name}
                      {currentGuest.type === 'tasting' && <span className="text-xs bg-purple-900 text-purple-200 px-2 py-0.5 rounded-full">試酒</span>}
                  </div>
                  <button onClick={() => handleCancelTab(currentGuest)} className="text-red-400 hover:text-red-300 text-xs bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-900/50">刪除訂單</button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 mb-4 space-y-4 scrollbar-hide pb-20">
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>已點項目 ({currentGuest.items.length})</span>
                      <span>小計: <span className="text-green-400 font-bold text-sm">${currentGuestSubtotal}</span></span>
                    </div>
                    <div className="space-y-2">
                      {currentGuest.items.map((item, idx) => (
                        <div key={item.orderId} className={`flex justify-between items-start bg-gray-800 p-3 rounded-lg border animate-in fade-in shadow-sm ${item.category === 'food' && !item.served ? 'border-amber-500/50' : 'border-gray-700'}`}>
                          <div className="flex items-start gap-3">
                            <span className="text-gray-600 text-xs font-mono w-4 pt-1">{idx + 1}.</span>
                            <div>
                              <div className="text-sm text-gray-200 font-bold flex items-center gap-2">
                                {item.name}
                                {item.type === 'treat' && <span className="text-[10px] bg-pink-900 text-pink-200 px-1.5 py-0.5 rounded">招待</span>}
                                {item.type === 'tasting' && <span className="text-[10px] bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded">試酒</span>}
                              </div>
                              {item.selectedAddons && item.selectedAddons.length > 0 && (
                                  <div className="text-[10px] text-gray-400 mt-0.5 flex flex-wrap gap-1">
                                      {item.selectedAddons.map(a => (<span key={a.id} className="bg-gray-700 px-1 rounded">+ {a.name}</span>))}
                                  </div>
                              )}
                              <div className="flex gap-2 mt-1">
                                {item.isKeg && <div className="text-[10px] text-amber-500">{item.category === 'food' ? '批次' : '生啤'}</div>}
                                {item.category === 'food' && (
                                    <div className={`text-[10px] flex items-center gap-1 px-1 rounded ${item.served ? 'text-green-400 bg-green-900/30' : 'text-amber-400 bg-amber-900/30'}`}>{item.served ? '已出餐' : '製作中'}</div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* 新增：招待切換按鈕 */}
                            <button 
                                onClick={() => toggleTreat(selectedGuestId, item.orderId)} 
                                className={`text-xs px-2 py-1 rounded border transition-colors ${item.type === 'treat' ? 'bg-pink-900 border-pink-500 text-pink-200' : 'bg-gray-800 border-gray-600 text-gray-500 hover:bg-gray-700'}`}
                            >
                                招待
                            </button>

                            {/* 價格/試酒切換按鈕 (如果是招待狀態，這裡顯示 $0 並禁用，或者保留顯示原價但劃掉? 這裡選擇顯示 $0 且不可點) */}
                            {item.type === 'treat' ? (
                                <div className="text-sm font-mono px-2 py-1 rounded border border-pink-900/50 text-pink-500 bg-pink-900/10 flex items-center gap-1 opacity-75">
                                    <Gift size={14}/> $0
                                </div>
                            ) : (
                                <button onClick={() => toggleItemType(selectedGuestId, item.orderId)} className={`text-sm font-mono px-2 py-1 rounded border flex items-center gap-1 ${item.type === 'tasting' ? 'border-purple-500 text-purple-400 bg-purple-900/20' : 'border-gray-700 text-gray-300 bg-gray-900'}`}>
                                    {item.type === 'tasting' ? <Wine size={14} /> : `$${item.price}`}
                                </button>
                            )}
                            
                            {item.category === 'food' && (
                                <button onClick={() => toggleServedStatus(selectedGuestId, item.orderId)} className={`p-1.5 rounded transition-colors ${item.served ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                                    {item.served ? <BellRing size={16}/> : <Bell size={16}/>}
                                </button>
                            )}
                            <button onClick={() => handleRemoveFromTab(selectedGuestId, item.orderId, item.id)} className="text-gray-600 hover:text-red-400 p-1"><XCircle size={18} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs text-gray-400 mb-2 font-bold sticky top-0 bg-gray-900 py-1 z-10">餐點與酒水</h3>
                    {foodInventory.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-[10px] text-amber-500 font-bold mb-1 pl-1 flex items-center gap-1"><Utensils size={10}/> 餐點</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {foodInventory.map(item => (
                                    <button key={item.id} onClick={() => handleItemClick(item)} className="p-3 rounded-lg text-left border border-amber-900/30 bg-gray-800/50 hover:bg-gray-800 active:scale-95 transition-all">
                                        <div className="font-bold text-sm text-gray-200">{item.name}</div>
                                        <div className="text-amber-500 font-mono font-bold text-right mt-1">${item.price}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 pb-4">
                      {[...bottleInventory, ...kegInventory].map(item => (
                        <button key={item.id} onClick={() => handleItemClick(item)} disabled={item.stock <= 0 && !item.isKeg} className={`p-3 rounded-lg text-left border transition-all active:scale-95 ${item.stock > 0 || item.isKeg ? 'bg-gray-800 border-gray-700 hover:border-amber-500/50 hover:bg-gray-750 shadow-sm' : 'bg-gray-900 border-gray-800 opacity-50 cursor-not-allowed'}`}>
                          <div className="font-bold text-sm text-gray-200 truncate">
                             {item.brand && <span className="text-xs text-gray-400 block">{item.brand}</span>}
                             {item.name}
                          </div>
                          <div className="flex justify-between items-end mt-1">
                            <span className="text-amber-500 font-mono font-bold">${item.price}</span>
                            <span className={`text-[10px] px-1.5 rounded ${item.stock < 1 && !item.isKeg ? 'bg-red-900 text-red-200' : 'bg-gray-700 text-gray-400'}`}>{item.isKeg ? (item.stock > 0 ? '供應中' : '已售完') : `剩${item.stock}`}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-auto pt-2 border-t border-gray-800 bg-gray-900 space-y-2">
                  <div className="flex items-center justify-between bg-gray-800 p-2 rounded-lg">
                       <div className="flex items-center gap-2 text-sm text-gray-300"><Percent size={16}/> 整單折扣</div>
                       <div className="flex items-center gap-2"><span className="text-gray-500 text-xs">-$</span>
                           <input type="number" className="w-20 bg-gray-900 border border-gray-700 rounded p-1 text-right text-white outline-none focus:border-amber-500"
                               value={currentGuest.discount || ''}
                               onChange={(e) => updateDiscount(selectedGuestId, e.target.value)}
                               placeholder="0"/>
                       </div>
                  </div>
                  <button onClick={() => handleCheckout(currentGuest)} className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"><CheckCircle size={24} /><span>結帳收款 ${currentGuestTotal}</span></button>
                </div>
               </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* 新增：匯出按鈕 (Header 區域) */}
            <div className="flex gap-2">
                <button onClick={() => setIsAdding(!isAdding)} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-bold shadow-md active:scale-95 transition-all">{isAdding ? '隱藏新增區塊' : <><Plus size={20}/> 新增品項</>}</button>
                <button onClick={handleExportInventory} className="w-1/3 bg-gray-700 hover:bg-gray-600 text-gray-200 py-3 rounded-lg flex items-center justify-center gap-2 font-bold shadow-md active:scale-95 transition-all border border-gray-600"><Download size={20}/> 匯出</button>
            </div>
            
            {isAdding && (
              <div className="bg-gray-800 p-4 rounded-lg border border-amber-500/50 animate-in fade-in slide-in-from-top-2">
                <div className="mb-3">
                  <label className="text-xs text-gray-400 mb-1 block">快速帶入歷史商品</label>
                  <select className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-gray-300 text-sm" onChange={(e) => handleRestockHistoryItem(e.target.value)} value={selectedHistoryItem}>
                    <option value="">-- 選擇舊酒款 --</option>
                    {productHistory.map((item, index) => (<option key={item.id || item.name || index} value={item.name}>{item.name}</option>))}
                  </select>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2 mb-2">
                      <button onClick={() => setNewItem({...newItem, category: 'drink', isKeg: false})} className={`flex-1 py-1 text-xs rounded border ${newItem.category === 'drink' && !newItem.isKeg ? 'bg-amber-600 border-amber-500 text-white' : 'border-gray-600 text-gray-400'}`}>瓶裝酒</button>
                      <button onClick={() => setNewItem({...newItem, category: 'drink', isKeg: true})} className={`flex-1 py-1 text-xs rounded border ${newItem.isKeg ? 'bg-amber-600 border-amber-500 text-white' : 'border-gray-600 text-gray-400'}`}>桶裝生啤</button>
                      <button onClick={() => setNewItem({...newItem, category: 'food', isKeg: false})} className={`flex-1 py-1 text-xs rounded border ${newItem.category === 'food' ? 'bg-amber-600 border-amber-500 text-white' : 'border-gray-600 text-gray-400'}`}>餐點</button>
                  </div>
                  <div className="flex gap-2">
                      {newItem.category === 'drink' && (<input placeholder="品牌 (Brand)" className="w-1/3 bg-gray-900 border border-gray-700 p-2 rounded text-white outline-none" value={newItem.brand} onChange={e => setNewItem({...newItem, brand: e.target.value})}/>)}
                      <input placeholder="名稱 (例如: IPA)" className="flex-1 bg-gray-900 border border-gray-700 p-2 rounded text-white focus:border-amber-500 outline-none" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}/>
                  </div>
                  <div className="flex gap-2">
                    <input placeholder="風格/備註" className="w-1/2 bg-gray-900 border border-gray-700 p-2 rounded text-white outline-none" value={newItem.style} onChange={e => setNewItem({...newItem, style: e.target.value})}/>
                    {!newItem.isKeg && newItem.category !== 'food' && (<input type="number" placeholder="庫存" className="w-1/2 bg-gray-900 border border-gray-700 p-2 rounded text-white outline-none" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})}/>)}
                  </div>
                  <div className="flex gap-2">
                    <input type="number" placeholder={newItem.isKeg || newItem.category === 'food' ? "整批/桶成本 $" : "單瓶成本 $"} className="w-1/2 bg-gray-900 border border-gray-700 p-2 rounded text-white outline-none" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})}/>
                    <input type="number" placeholder="售價 $" className="w-1/2 bg-gray-900 border border-gray-700 p-2 rounded text-white outline-none" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})}/>
                  </div>
                  <button onClick={handleAddItem} className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold flex items-center justify-center gap-2"><Save size={16}/> 儲存入庫 (可連續輸入)</button>
                </div>
              </div>
            )}
            
            <div>
              <div className="flex justify-between items-center mb-2 pl-1">
                <h3 className="text-gray-400 text-sm font-bold flex items-center gap-2"><Utensils size={16}/> 餐點管理 ({foodInventory.length})</h3>
                <button onClick={() => setAddonManageModal(true)} className="text-xs bg-gray-800 border border-gray-600 text-gray-300 px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-700"><Edit3 size={12}/> 管理客製選項</button>
              </div>
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm table-fixed">
                  <thead className="bg-gray-700 text-gray-300"><tr><th className="p-3 w-[50%]">品名/成本監控</th><th className="p-3 text-center w-[30%]">狀態</th><th className="p-3 text-right w-[20%]"></th></tr></thead>
                  <tbody className="divide-y divide-gray-700">
                    {foodInventory.length === 0 ? (<tr><td colSpan="3" className="p-4 text-center text-gray-500 text-xs">無餐點資料</td></tr>) : (
                      foodInventory.map(item => (
                        <tr key={item.id}>
                          <td className="p-3">
                              <div className="font-bold text-gray-200 flex items-center gap-1">{item.name}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                  <div>累積成本: ${item.cost} | 售價: ${item.price}</div>
                                  <div className="text-[10px] text-gray-500 mt-0.5">入庫: {formatDate(item.createdAt)}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${Math.min((item.kegRevenue / Math.max(item.cost, 1)) * 100, 100)}%` }}></div></div>
                                    <span className="text-green-400 font-mono text-[10px]">{item.kegRevenue >= item.cost ? `賺 $${item.kegRevenue - item.cost}` : `回收 ${Math.round((item.kegRevenue/item.cost)*100)}%`}</span>
                                  </div>
                              </div>
                          </td>
                          <td className="p-3 text-center align-middle space-y-1">
                            <button onClick={() => setAddCostModal({isOpen: true, item: item, amount: ''})} className="block w-full text-[10px] bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded border border-gray-600 whitespace-nowrap">➕ 追加成本</button>
                            <button onClick={() => handleFinishBatch(item)} className="block w-full text-[10px] bg-gray-700 hover:bg-red-900 text-white px-2 py-1 rounded border border-gray-600 whitespace-nowrap">結算此批</button>
                          </td>
                          <td className="p-3 text-right align-middle"><button onClick={() => handleDeleteItem(item.id)} className="text-gray-500 hover:text-red-400 p-1"><Trash2 size={16} /></button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-gray-400 text-sm font-bold mb-2 pl-1 flex items-center gap-2"><Beer size={16}/> 瓶/罐裝庫存 ({bottleInventory.length})</h3>
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm table-fixed">
                  <thead className="bg-gray-700 text-gray-300"><tr><th className="p-3 w-[50%]">品名</th><th className="p-3 text-center w-[30%]">庫存</th><th className="p-3 text-right w-[20%]"></th></tr></thead>
                  <tbody className="divide-y divide-gray-700">
                    {bottleInventory.length === 0 ? (<tr><td colSpan="3" className="p-4 text-center text-gray-500 text-xs">無瓶裝商品</td></tr>) : (
                      bottleInventory.map(item => (
                        <tr key={item.id}>
                          <td className="p-3">
                              <div className="font-bold text-gray-200 flex flex-col">{item.brand && <span className="text-[10px] text-amber-500 mb-0.5">{item.brand}</span>}<span>{item.name}</span></div>
                              <div className="text-xs text-gray-500">成本: ${item.cost} | 售價: ${item.price}</div>
                              <div className="text-[10px] text-gray-600 mt-0.5">入庫: {formatDate(item.createdAt)}</div>
                          </td>
                          <td className="p-3 text-center align-middle"><span className={`px-2 py-1 rounded-full text-xs font-bold ${item.stock < 5 ? 'bg-red-900 text-red-200' : 'bg-gray-700 text-gray-300'}`}>{item.stock}</span></td>
                          <td className="p-3 text-right align-middle"><button onClick={() => handleDeleteItem(item.id)} className="text-gray-500 hover:text-red-400 p-1"><Trash2 size={16} /></button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-gray-400 text-sm font-bold mb-2 pl-1 flex items-center gap-2"><Archive size={16}/> 桶裝生啤庫存 ({kegInventory.length})</h3>
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm table-fixed">
                  <thead className="bg-gray-700 text-gray-300"><tr><th className="p-3 w-[50%]">品名</th><th className="p-3 text-center w-[30%]">狀態</th><th className="p-3 text-right w-[20%]"></th></tr></thead>
                  <tbody className="divide-y divide-gray-700">
                    {kegInventory.length === 0 ? (<tr><td colSpan="3" className="p-4 text-center text-gray-500 text-xs">無桶裝生啤</td></tr>) : (
                      kegInventory.map(item => (
                        <tr key={item.id}>
                          <td className="p-3">
                              <div className="font-bold text-gray-200 flex flex-col">
                                  {item.brand && <span className="text-[10px] text-amber-500 mb-0.5">{item.brand}</span>}
                                  <div className="flex items-center gap-1">{item.name}<span className="text-[10px] bg-amber-900 text-amber-200 px-1.5 rounded">生啤</span></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                  <div>成本: ${item.cost} | 杯價: ${item.price}</div>
                                  <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2">
                                      <span>開桶: {formatDate(item.openedAt || item.createdAt)}</span>
                                      <button onClick={() => setDateEditModal({isOpen: true, item: item, newDate: toLocalISOString(item.openedAt || item.createdAt)})} className="text-gray-400 hover:text-white"><Edit3 size={10}/></button>
                                  </div>
                                  <div className="text-gray-400 font-bold mt-0.5">已賣出: {item.glassesSold || 0} 杯</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${Math.min((item.kegRevenue / item.cost) * 100, 100)}%` }}></div></div>
                                    <span className="text-amber-400 font-mono text-[10px]">{item.kegRevenue >= item.cost ? `已賺 $${item.kegRevenue - item.cost}` : `剩 $${item.cost - item.kegRevenue}`}</span>
                                  </div>
                              </div>
                          </td>
                          <td className="p-3 text-center align-middle">
                            <button onClick={() => handleFinishBatch(item)} className="text-[10px] bg-gray-700 hover:bg-red-900 text-white px-2 py-1 rounded border border-gray-600 whitespace-nowrap">結算此桶</button>
                          </td>
                          <td className="p-3 text-right align-middle"><button onClick={() => handleDeleteItem(item.id)} className="text-gray-500 hover:text-red-400 p-1"><Trash2 size={16} /></button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex bg-gray-800 p-1 rounded-lg mb-4 overflow-x-auto">
              <button onClick={() => setStatsSubTab('overview')} className={`flex-1 py-2 px-3 text-xs rounded-md font-bold whitespace-nowrap transition-colors ${statsSubTab === 'overview' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>即時概況</button>
              <button onClick={() => setStatsSubTab('monthly')} className={`flex-1 py-2 px-3 text-xs rounded-md font-bold whitespace-nowrap transition-colors ${statsSubTab === 'monthly' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>月度分析</button>
              <button onClick={() => setStatsSubTab('expenses')} className={`flex-1 py-2 px-3 text-xs rounded-md font-bold whitespace-nowrap transition-colors ${statsSubTab === 'expenses' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>雜支管理</button>
            </div>

            {statsSubTab === 'overview' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="text-gray-400 text-xs mb-1">總營收 (Revenue)</div>
                    <div className="text-2xl font-bold text-amber-400 font-mono">${totalRevenue.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="text-gray-400 text-xs mb-1">總雜支支出</div>
                    <div className="text-2xl font-bold text-red-400 font-mono">${totalExpenses.toLocaleString()}</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-900 to-gray-800 p-6 rounded-xl border border-green-700/50 text-center relative">
                  <button onClick={() => exportToCSV(salesLog, 'sales_report')} className="absolute top-4 right-4 text-green-300 hover:text-white opacity-50 hover:opacity-100"><Download size={20}/></button>
                  <div className="text-green-200 text-sm mb-2 flex items-center justify-center gap-2"><DollarSign size={16}/> 已實現淨利 (Net Profit)</div>
                  <div className="text-4xl font-bold text-white font-mono tracking-tight">${totalRealizedProfit.toLocaleString()}</div>
                  <div className="text-xs text-green-300/70 mt-2">已扣除：瓶裝成本、批次結算成本、雜支、折扣</div>
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-700 flex items-center gap-2"><History size={16} className="text-amber-500"/> <h2 className="text-sm font-bold text-gray-300">交易紀錄明細</h2></div>
                  <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                    {groupedSales.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-8">暫無銷售資料</div>
                    ) : (
                      groupedSales.map(dayGroup => (
                        <div key={dayGroup.date} className="border-b border-gray-700 last:border-0">
                          <button onClick={() => toggleDate(dayGroup.date)} className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-750 transition-colors">
                            <div className="flex items-center gap-2">
                              {expandedDates[dayGroup.date] ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                              <span className="font-bold text-gray-200 text-sm">{dayGroup.date}</span>
                              <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">{dayGroup.transactions.length} 筆</span>
                            </div>
                            <span className="font-mono text-amber-400 font-bold">${dayGroup.totalRevenue}</span>
                          </button>

                          {expandedDates[dayGroup.date] && (
                            <div className="bg-gray-900/50 animate-in slide-in-from-top-2">
                              {dayGroup.transactions.map(trans => (
                                <div key={trans.id} className="border-l-4 border-gray-700 ml-4">
                                  <button onClick={() => toggleTrans(trans.id)} className="w-full flex items-center justify-between p-3 pr-4 hover:bg-gray-800/50 transition-colors text-left">
                                    <div className="flex items-center gap-3">
                                      {expandedTrans[trans.id] ? <ChevronUp size={14} className="text-gray-500"/> : <ChevronDown size={14} className="text-gray-500"/>}
                                      <div>
                                        <div className="text-sm font-bold text-gray-300 flex items-center gap-2">{trans.customerName}</div>
                                        <div className="text-[10px] text-gray-500 font-mono">{trans.time}</div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      {trans.items[0]?.type === 'keg_cost' ? (
                                          <div className="text-red-400 font-mono text-sm font-bold">成本支出</div>
                                      ) : trans.items[0]?.type === 'discount' ? (
                                          <div className="text-yellow-400 font-mono text-sm font-bold">折扣</div>
                                      ) : (
                                          <div className="text-white font-mono text-sm font-bold">${trans.total}</div>
                                      )}
                                      <div className={`text-[10px] ${trans.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>損益 ${trans.profit}</div>
                                    </div>
                                  </button>
                                  {expandedTrans[trans.id] && (
                                    <div className="bg-gray-950/30 px-4 py-2 text-xs text-gray-400 space-y-1 animate-in fade-in">
                                      {trans.items.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 items-center hover:text-gray-200">
                                          <div className="col-span-8 truncate flex items-center gap-2">
                                            <span className="w-3 text-gray-700 font-mono">{idx+1}.</span>
                                            {item.name}
                                            {item.type === 'treat' && <span className="text-[8px] bg-pink-900 text-pink-200 px-1 rounded">招待</span>}
                                            {item.type === 'tasting' && <span className="text-[8px] bg-purple-900 text-purple-200 px-1 rounded">試酒</span>}
                                            {item.type === 'keg_cost' && <span className="text-[8px] bg-red-900 text-red-200 px-1 rounded">批次結算</span>}
                                            {item.type === 'discount' && <span className="text-[8px] bg-yellow-900 text-yellow-200 px-1 rounded">折扣</span>}
                                          </div>
                                          <div className="col-span-4 text-right font-mono text-gray-500">
                                              {item.type === 'keg_cost' || item.type === 'discount' ? `-$${-item.profit}` : `$${item.price}`}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {statsSubTab === 'monthly' && (
              <div className="space-y-6">
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 relative">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2"><BarChart3 size={16} className="text-amber-500"/> 年度獲利趨勢 <span className="text-xs text-gray-500 ml-2">(點擊月份查看詳情)</span></h2>
                      {/* 新增：月報表匯出按鈕 */}
                      <button onClick={() => exportToCSV(monthlyData, 'monthly_report')} className="flex items-center gap-1 text-xs bg-green-700/50 hover:bg-green-600 text-green-200 px-2 py-1 rounded border border-green-700 transition-colors">
                          <Download size={12}/> 匯出月報表
                      </button>
                  </div>
                  
                  {monthlyData.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-gray-600 text-xs">尚無資料</div>
                  ) : (
                    <div className="flex items-end gap-2 h-48 pb-6 pt-2 overflow-x-auto">
                      {monthlyData.map((data) => {
                        const heightPercent = Math.max((data.profit / maxMonthlyProfit) * 100, 5);
                        const isSelected = selectedMonth === data.month;
                        return (
                          <div key={data.month} className="flex-1 min-w-[40px] flex flex-col items-center group relative cursor-pointer" onClick={() => setSelectedMonth(data.month === selectedMonth ? null : data.month)}>
                            <div className={`w-full rounded-t-sm transition-all hover:opacity-80 ${data.profit < 0 ? 'bg-red-500' : 'bg-green-600'} ${isSelected ? 'ring-2 ring-white' : ''}`} style={{ height: `${Math.abs(heightPercent)}%` }}></div>
                            <div className={`text-[10px] mt-1 whitespace-nowrap rotate-0 ${isSelected ? 'text-white font-bold' : 'text-gray-500'}`}>{data.month.split('-')[1]}月</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 每日詳情列表 (當有選擇月份時顯示) */}
                {selectedMonth && (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-4">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-750">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Calendar size={16} className="text-amber-500"/> {selectedMonth} 每日銷售詳情
                            </h3>
                            <button onClick={() => setSelectedMonth(null)} className="text-gray-400 hover:text-white"><X size={16}/></button>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {dailyStats.length === 0 ? (
                                <div className="text-center py-6 text-gray-500 text-xs">該月份無詳細銷售資料</div>
                            ) : (
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-900 text-gray-400 sticky top-0">
                                        <tr>
                                            <th className="p-3">日期</th>
                                            <th className="p-3 text-right">營收</th>
                                            <th className="p-3 text-right">淨利</th>
                                            <th className="p-3 text-right">筆數</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {dailyStats.map(day => (
                                            <tr key={day.date} className="hover:bg-gray-700/50">
                                                <td className="p-3 text-gray-300">{day.date}</td>
                                                <td className="p-3 text-right font-mono text-amber-400">${day.revenue}</td>
                                                <td className={`p-3 text-right font-mono font-bold ${day.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    ${day.profit}
                                                </td>
                                                <td className="p-3 text-right text-gray-500">{day.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <h2 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2"><Calendar size={16}/> 手動補登過往淨利</h2>
                  <p className="text-xs text-gray-500 mb-3">可在此輸入之前的備忘錄紀錄，將會整合至上方圖表。</p>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 mb-1 block">月份 (YYYY-MM)</label>
                      <input type="month" className="w-full bg-gray-900 border border-gray-600 p-2 rounded text-white text-sm" value={manualEntry.month} onChange={e => setManualEntry({...manualEntry, month: e.target.value})}/>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 mb-1 block">淨利金額</label>
                      <input type="number" placeholder="例如: 5000" className="w-full bg-gray-900 border border-gray-600 p-2 rounded text-white text-sm" value={manualEntry.profit} onChange={e => setManualEntry({...manualEntry, profit: e.target.value})}/>
                    </div>
                    <button onClick={handleAddManualEntry} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded h-[38px] w-[38px] flex items-center justify-center"><Plus size={20}/></button>
                  </div>
                </div>
              </div>
            )}

            {statsSubTab === 'expenses' && (
              <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
                    <h2 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2"><Plus size={16}/> 新增支出</h2>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <select className="w-1/2 bg-gray-900 border border-gray-600 p-2 rounded text-white text-sm" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                                {DEFAULT_EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="custom">自訂...</option>
                            </select>
                            {newExpense.category === 'custom' && (
                                <input type="text" placeholder="輸入項目名稱" className="w-1/2 bg-gray-900 border border-gray-600 p-2 rounded text-white text-sm outline-none" value={customCategory} onChange={e => setCustomCategory(e.target.value)}/>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input type="number" placeholder="金額 $" className="flex-1 bg-gray-900 border border-gray-600 p-2 rounded text-white text-sm outline-none" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})}/>
                            <input type="date" className="flex-1 bg-gray-900 border border-gray-600 p-2 rounded text-white text-sm outline-none" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})}/>
                        </div>
                        <input type="text" placeholder="備註 (選填)" className="w-full bg-gray-900 border border-gray-600 p-2 rounded text-white text-sm outline-none" value={newExpense.note} onChange={e => setNewExpense({...newExpense, note: e.target.value})}/>
                        <button onClick={handleAddExpense} className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded font-bold flex items-center justify-center gap-2"><Save size={16}/> 記錄支出</button>
                    </div>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2"><ClipboardList size={16}/> 支出明細</h2>
                        <span className="text-xs text-gray-500">總計: ${expenses.reduce((acc, curr) => acc + curr.amount, 0)}</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {expenses.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">尚無支出紀錄</div>
                        ) : (
                            expenses.sort((a,b) => new Date(b.date) - new Date(a.date)).map(exp => (
                                <div key={exp.id} className="p-3 border-b border-gray-700 flex justify-between items-center hover:bg-gray-750 group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-700 rounded-full text-gray-400">
                                            {exp.category.includes('水') ? <Droplet size={14}/> : exp.category.includes('電') ? <Zap size={14}/> : exp.category.includes('網') ? <Wifi size={14}/> : <FileText size={14}/>}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-200">{exp.category}</div>
                                            <div className="text-[10px] text-gray-500">{exp.date} {exp.note && `• ${exp.note}`}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-red-400 font-mono font-bold">-${exp.amount}</span>
                                        <button onClick={() => handleDeleteExpense(exp.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Nav */}
      <nav className="fixed bottom-0 w-full bg-gray-800 border-t border-gray-700 pb-safe z-30">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          <button onClick={() => { setActiveTab('pos'); setSelectedGuestId(null); }} className={`flex flex-col items-center gap-1 w-full h-full justify-center ${activeTab === 'pos' ? 'text-amber-500' : 'text-gray-500'}`}><Users size={24} /><span className="text-[10px] font-bold">客人/結帳</span></button>
          <button onClick={() => setActiveTab('inventory')} className={`flex flex-col items-center gap-1 w-full h-full justify-center ${activeTab === 'inventory' ? 'text-amber-500' : 'text-gray-500'}`}><Beer size={24} /><span className="text-[10px] font-bold">庫存管理</span></button>
          <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 w-full h-full justify-center ${activeTab === 'stats' ? 'text-amber-500' : 'text-gray-500'}`}><BarChart3 size={24} /><span className="text-[10px] font-bold">獲利報表</span></button>
        </div>
      </nav>
    </div>
  );
}