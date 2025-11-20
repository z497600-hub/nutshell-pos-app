// src/App.jsx
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, update, remove } from 'firebase/database';
// import './App.css'; // 假設您有自己的樣式文件

// --- Firebase 初始化與設定 (請替換為您的環境變數或直接的金鑰) ---
// 由於 Vercel 部署時需要 REACT_APP_ 前綴，我們以環境變數形式呈現
const firebaseConfig = {
  apiKey: "AIzaSyCttL6OGxarz4OivOqYYYbeXAmFacrItiQ",
  authDomain: "nutshell-manage-6f33d.firebaseapp.com",
  projectId: "nutshell-manage-6f33d",
  storageBucket: "nutshell-manage-6f33d.firebasestorage.app",
  messagingSenderId: "729068840654",
  appId: "1:729068840654:web:f5933600d7e3ea74fe529f",
  measurementId: "G-F2SP6JV209"
};

const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
const db = app ? getDatabase(app) : null;

function App() {
  const [inventory, setInventory] = useState([]);
  const [newName, setNewName] = useState('');
  const [newVolume, setNewVolume] = useState('');
  const [newCost, setNewNameCost] = useState('');
  const [isKeg, setIsKeg] = useState(false);
  const [isSyncing, setIsSyncing] = useState(!!app);

  // 1. 讀取 Firebase 資料
  useEffect(() => {
    if (!db) {
        setIsSyncing(false);
        return;
    }
    const inventoryRef = ref(db, 'inventory');
    
    // onValue 實現即時同步
    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      const loadedInventory = [];
      for (let id in data) {
        loadedInventory.push({ id, ...data[id] });
      }
      setInventory(loadedInventory);
      setIsSyncing(true);
    }, (error) => {
        console.error("Firebase 連線錯誤:", error);
        setIsSyncing(false);
    });

    // 清理函式 (組件卸載時取消訂閱)
    return () => unsubscribe();
  }, []);

  // 2. 新增項目
  const addItem = () => {
    if (!db || newName.trim() === '' || newVolume <= 0 || newCost <= 0) return;

    const newItem = {
      name: newName,
      volume: parseFloat(newVolume),
      cost: parseFloat(newCost),
      currentVolume: isKeg ? parseFloat(newVolume) : parseFloat(newVolume), 
      isKeg: isKeg, 
      lastPour: isKeg ? new Date().toISOString() : null,
    };

    push(ref(db, 'inventory'), newItem);
    
    setNewName('');
    setNewVolume('');
    setNewCost('');
    setIsKeg(false);
  };

  // 3. 調整庫存
  const adjustVolume = (id, amount) => {
    if (!db) return;
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    const newCurrentVolume = Math.max(0, item.currentVolume + amount);
    
    const itemRef = ref(db, `inventory/${id}`);
    update(itemRef, { 
      currentVolume: newCurrentVolume,
      lastPour: amount < 0 && item.isKeg ? new Date().toISOString() : item.lastPour,
    });
  };

  // 4. 生啤結算 (歸零)
  const resetKeg = (id) => {
    if (!db) return;
    remove(ref(db, `inventory/${id}`));
  };

  // 5. 渲染輔助函式 (進度條)
  const renderProgressBar = (item) => {
    if (!item.isKeg) return null;

    const percentage = ((item.volume - item.currentVolume) / item.volume) * 100;
    const progressBarStyle = {
      width: `${percentage}%`,
      backgroundColor: percentage > 80 ? 'red' : percentage > 50 ? 'orange' : 'green',
      height: '10px',
      borderRadius: '5px',
      transition: 'width 0.5s ease',
    };

    return (
      <div style={{ margin: '5px 0', border: '1px solid #ccc', borderRadius: '5px' }}>
        <div style={progressBarStyle}></div>
        <small>{percentage.toFixed(1)}% 已售出 (剩下: {item.currentVolume.toFixed(1)}L)</small>
      </div>
    );
  };

  // 區分庫存：瓶裝/罐裝 vs 桶裝生啤
  const packagedItems = inventory.filter(item => !item.isKeg);
  const kegItems = inventory.filter(item => item.isKeg);

  return (
    <div className="App" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🍺 啤酒吧庫存管理 (Firebase 雲端版)</h1>
      <p style={{ color: isSyncing ? 'green' : 'red', fontWeight: 'bold' }}>
          {isSyncing ? '✓ 雲端同步中' : '❌ 資料庫連線失敗/金鑰遺失'}
      </p>

      {/* 1. 新增項目區 */}
      <h2>新增庫存</h2>
      <div className="add-form" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', border: '1px solid #eee', padding: '15px', borderRadius: '5px' }}>
        <input style={{ flex: '1 1 150px', padding: '8px' }}
          type="text" 
          placeholder="啤酒名稱" 
          value={newName} 
          onChange={(e) => setNewName(e.target.value)} 
        />
        <input style={{ flex: '1 1 100px', padding: '8px' }}
          type="number" 
          placeholder="容量 (L)" 
          value={newVolume} 
          onChange={(e) => setNewVolume(e.target.value)} 
        />
        <input style={{ flex: '1 1 100px', padding: '8px' }}
          type="number" 
          placeholder="成本 ($)" 
          value={newCost} 
          onChange={(e) => setNewCost(e.target.value)} 
        />
        <label style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input 
            type="checkbox" 
            checked={isKeg} 
            onChange={(e) => setIsKeg(e.target.checked)} 
          />
          是否為桶裝生啤？
        </label>
        <button onClick={addItem} style={{ padding: '8px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>新增</button>
      </div>

      <hr style={{ margin: '20px 0' }} />

      {/* 2. 桶裝生啤區 (優化顯示) */}
      <h2>🟢 桶裝生啤 (Kegs)</h2>
      {kegItems.length === 0 ? <p>目前沒有桶裝生啤。</p> : (
        <ul className="inventory-list" style={{ listStyle: 'none', padding: 0 }}>
          {kegItems.map(item => (
            <li key={item.id} className="keg-item" style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
              <h3>{item.name} ({item.volume}L / 成本 ${item.cost})</h3>
              {renderProgressBar(item)}
              <div className="keg-controls" style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => adjustVolume(item.id, -0.5)} style={{ padding: '8px', cursor: 'pointer' }}>-0.5L</button>
                <button onClick={() => adjustVolume(item.id, -1)} style={{ padding: '8px', cursor: 'pointer' }}>-1L</button>
                <button onClick={() => adjustVolume(item.id, 0.5)} style={{ padding: '8px', cursor: 'pointer' }}>+0.5L (補貨)</button>
                <button onClick={() => resetKeg(item.id)} style={{ padding: '8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>❌ 結算/移除</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      <hr style={{ margin: '20px 0' }} />
      
      {/* 3. 瓶/罐裝區 (一般庫存) */}
      <h2>📦 瓶裝/罐裝 (Packaged)</h2>
      {packagedItems.length === 0 ? <p>目前沒有瓶裝或罐裝啤酒。</p> : (
        <ul className="inventory-list" style={{ listStyle: 'none', padding: 0 }}>
          {packagedItems.map(item => (
            <li key={item.id} className="packaged-item" style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{item.name} | 庫存: {item.currentVolume} 單位</span>
              <div className="packaged-controls" style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => adjustVolume(item.id, -1)} style={{ padding: '8px', cursor: 'pointer' }}>-1</button>
                <button onClick={() => adjustVolume(item.id, 1)} style={{ padding: '8px', cursor: 'pointer' }}>+1</button>
                <button onClick={() => resetKeg(item.id)} style={{ padding: '8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>移除</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;