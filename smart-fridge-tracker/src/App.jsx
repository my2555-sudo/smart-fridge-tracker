import { useState, useEffect } from 'react';
import AddItemBar from './components/AddItemBar';
import FridgeList from './components/FridgeList';
import ExpiringPanel from './components/ExpiringPanel';
import RecipeSuggestions from './components/RecipeSuggestions';
import CategoryShelfLifeEditor from './components/CategoryShelfLifeEditor';
import StatsDashboard from './components/StatsDashboard';   // ✅ 新增：引入仪表盘

import './App.css';

export default function App() {
  // 1) fridge items state (persisted)
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('items')) || []; }
    catch { return []; }
  });

  // ✅ 新增：接收菜谱数量
  const [recipeCount, setRecipeCount] = useState(0);

  // 2) persist to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('items', JSON.stringify(items));
  }, [items]);

  // 3) add / remove / update
  function handleAdd(item) {
    setItems(prev => [item, ...prev]);
  }
  function handleRemove(id) {
    setItems(prev => prev.filter(i => i.id !== id));
  }
  function handleUpdate(id, patch) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  }

  // 4) page layout
  return (
    <div className="app">
      <h1>🥦 Smart Fridge Tracker</h1>

      {/* input bar: name/barcode + optional days override */}
      <AddItemBar onAdd={handleAdd} />

      {/* optional: category-level shelf-life editor (uses OFF categories) */}
      <CategoryShelfLifeEditor />

      {/* decision-support sections */}
      <ExpiringPanel items={items} />

      {/* ✅ 传入 onCountChange，把数量回传给 setRecipeCount */}
      <RecipeSuggestions items={items} onCountChange={setRecipeCount} />

      {/* main list */}
      <FridgeList items={items} onRemove={handleRemove} onUpdate={handleUpdate} />

      {/* ✅ 新增：可视化仪表盘（构成 + 浪费率趋势） */}
      <StatsDashboard items={items} />

      <footer>
        Data source: Open Food Facts + TheMealDB (for educational use)
        {' · Recipes found: '}{recipeCount}
      </footer>
    </div>
  );




  
}

