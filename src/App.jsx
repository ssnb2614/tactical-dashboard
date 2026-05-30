import { useEffect, useState } from 'react';
import { fetchWeapons } from './utils/sheetFetcher';
import { ref, set, onValue } from 'firebase/database';
import { db } from './firebaseConfig';

function App() {
  // 陣營狀態：'none' (未選擇), 'swat' (特勤隊), 'suspect' (嫌犯)
  const [faction, setFaction] = useState('none');
  const [weapons, setWeapons] = useState([]);
  const [roomStatus, setRoomStatus] = useState("等待雙方就位...");
  const [isRosterOpen, setIsRosterOpen] = useState(true);
  const [selectedOperator, setSelectedOperator] = useState(null);
  
  // 模擬的回合與時間軸資料 (未來由 Firebase 與 Tick 引擎驅動)
  const [gameTime, setGameTime] = useState({ turn: 1, seconds: 5 });

  // 模擬的特勤隊角色清單 (未來從 Google Sheets 的 Operators 分頁抓取)
  const [operators, setOperators] = useState([
    { id: 'OP_HAMMER', name: 'Hammer', role: '重裝破門手', status: 'normal', ready: true },
    { id: 'OP_SPECTER', name: 'Specter', role: '輕裝斥候', status: 'injured', ready: true },
    { id: 'OP_VIPER', name: 'Viper', role: '毒氣專家', status: 'critical', ready: false },
    { id: 'OP_PHANTOM', name: 'Phantom', role: '狙擊觀察手', status: 'dead', ready: false },
  ]);

  useEffect(() => {
    fetchWeapons().then(data => setWeapons(data));

    // 監聽測試房間狀態
    const roomRef = ref(db, 'rooms/test_room_01/status');
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if(data) setRoomStatus(data);
    });
  }, []);

  const handleExecute = () => {
    if (window.confirm("確認執行本回合戰術規劃？一旦提交將無法修改，進入無情結算！")) {
      set(ref(db, 'rooms/test_room_01/status'), `${faction.toUpperCase()} 已提交計畫，時間戳: ${Date.now()}`);
    }
  };

  // 1. 陣營選擇畫面 (尚未選擇陣營時顯示)
  if (faction === 'none') {
    return (
      <div className="flex h-screen w-screen font-mono text-white select-none">
        {/* 左半邊：特勤隊 */}
        <div 
          onClick={() => setFaction('swat')}
          className="flex-1 bg-[#0B1320] flex flex-col justify-center items-center border-r border-slate-800 cursor-pointer transition-all duration-300 hover:bg-[#142238] group"
        >
          <div className="text-4xl font-black text-slate-500 group-hover:text-[#4FC3F7] tracking-widest transition-colors">
            CRISIS RESPONSE UNIT
          </div>
          <div className="text-sm text-slate-600 mt-2 group-hover:text-slate-4xl">
            [ 進入特勤指揮終端 - 海軍藍 ]
          </div>
        </div>
        {/* 右半邊：嫌犯 */}
        <div 
          onClick={() => setFaction('suspect')}
          className="flex-1 bg-[#1A1A1A] flex flex-col justify-center items-center cursor-pointer transition-all duration-300 hover:bg-[#2C2C2C] group"
        >
          <div className="text-4xl font-black text-slate-600 group-hover:text-[#FF9000] tracking-widest transition-colors">
            HOSTILE ELEMENTS
          </div>
          <div className="text-sm text-slate-500 mt-2 group-hover:text-slate-400">
            [ 進入地下黑市網絡 - 琥珀橘 ]
          </div>
        </div>
      </div>
    );
  }

  // 根據陣營動態決定顏色主題
  const theme = {
    bg: faction === 'swat' ? 'bg-[#0B1320]' : 'bg-[#1A1A1A]',
    panelBg: faction === 'swat' ? 'bg-[#142238]/80' : 'bg-[#2C2C2C]/80',
    accent: faction === 'swat' ? 'text-[#4FC3F7]' : 'text-[#FF9000]',
    border: faction === 'swat' ? 'border-[#4FC3F7]/30' : 'border-[#FF9000]/30',
    btn: faction === 'swat' ? 'bg-[#4FC3F7] text-black font-bold' : 'bg-[#FF9000] text-black font-bold',
  };

  // 狀態框顏色對照
  const getStatusColor = (status) => {
    switch(status) {
      case 'normal': return 'border-green-500';
      case 'injured': return 'border-yellow-500';
      case 'critical': return 'border-red-500 animate-pulse';
      case 'dead': return 'border-zinc-800 bg-zinc-900/50';
      default: return 'border-slate-500';
    }
  };

  // 2. 主遊戲戰術大廳 UI
  return (
    <div className={`h-screen w-screen ${theme.bg} text-[#E0E0E0] font-mono flex flex-col overflow-hidden select-none`}>
      
      {/* 頂部戰術列：時鐘與回合 */}
      <header className={`h-14 border-b ${theme.border} ${theme.panelBg} flex justify-between items-center px-6 z-10`}>
        <div className="flex items-center space-x-4">
          <span className={`text-xs font-bold px-2 py-1 border ${theme.border} ${theme.accent}`}>
            {faction.toUpperCase()} TERMINAL
          </span>
          <span className="text-xs text-slate-400">房號: test_room_01</span>
        </div>
        
        {/* 時鐘與時間軸 */}
        <div className="text-center">
          <div className="text-xl font-bold tracking-widest text-white">
            T+ {String(Math.floor(gameTime.seconds / 60)).padStart(2, '0')}:{String(gameTime.seconds % 60).padStart(2, '0')}
          </div>
          <div className="text-[10px] text-slate-400 tracking-wider">
            TURN {gameTime.turn} (5s PER TICK)
          </div>
        </div>

        <div className="text-xs text-slate-400 max-w-xs truncate">
          網路狀態: <span className={theme.accent}>{roomStatus}</span>
        </div>
      </header>

      {/* 中間主戰場區域 */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* 左側角色列表 (可收納) */}
        <div className={`transition-all duration-300 flex h-full ${isRosterOpen ? 'w-80' : 'w-0'} relative ${theme.panelBg} border-r ${theme.border}`}>
          <div className="flex-1 p-4 flex flex-col space-y-3 overflow-y-auto w-80">
            <div className="text-xs font-bold text-slate-400 tracking-wider border-b border-slate-700 pb-1 flex justify-between">
              <span>ROSTER (小隊名單)</span>
              <span className="cursor-pointer text-xs" onClick={() => setFaction('none')}>[登出]</span>
            </div>
            
            {operators.map(op => (
              <div 
                key={op.id}
                onClick={() => op.status !== 'dead' && setSelectedOperator(op)}
                className={`flex items-center p-2 border ${getStatusColor(op.status)} ${op.status === 'dead' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'} transition-all`}
              >
                {/* 模擬頭像框 */}
                <div className={`w-12 h-12 border-2 ${getStatusColor(op.status)} flex flex-col justify-center items-center text-xs bg-black font-black text-center shrink-0 relative`}>
                  {op.status === 'dead' ? (
                    <span className="text-[10px] text-red-600 font-bold scale-90">KIA</span>
                  ) : (
                    <span className="text-slate-400">{op.name[0]}</span>
                  )}
                  {/* Ready 狀態燈 E */}
                  {op.ready && op.status !== 'dead' && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-black text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center scale-90">
                      E
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm font-bold truncate text-white">{op.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{op.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 側邊欄收納開關按鈕 */}
        <button 
          onClick={() => setIsRosterOpen(!isRosterOpen)}
          className={`absolute left-${isRosterOpen ? '80' : '0'} top-1/2 -translate-y-1/2 bg-slate-800 text-white border-y border-r ${theme.border} px-1 py-4 text-xs transition-all z-20 hover:bg-slate-700`}
        >
          {isRosterOpen ? '◀' : '▶'}
        </button>

        {/* 中央 3D 地圖預留區 (目前先用黑曜石格線代替) */}
        <main className="flex-1 bg-[#121212] flex flex-col justify-center items-center relative p-4">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#232323_1px,transparent_1px),linear-gradient(to_bottom,#232323_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>
          
          <div className="text-center z-10 border border-dashed border-slate-700 p-8 rounded-lg bg-black/40 max-w-md">
            <p className={`text-lg font-bold ${theme.accent} mb-2`}>[ 3D TACTICAL SANDBOX ]</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              這是未來的 Three.js 上帝視角空間。<br />
              在此處你將能進行「左鍵按住拖曳畫出移動路徑」，以及「Shift + 右鍵拖曳鎖定 3D 警戒光錐」。
            </p>
          </div>

          {/* 浮動式角色卡 (當點選名單角色時置中放大呈現) */}
          {selectedOperator && (
            <div className="absolute inset-0 bg-black/70 flex justify-center items-center z-30 p-4">
              <div className={`w-full max-w-lg ${theme.panelBg} border-2 ${theme.border} p-6 relative flex flex-col`}>
                <button 
                  onClick={() => setSelectedOperator(null)}
                  className="absolute top-3 right-4 text-slate-400 hover:text-white text-lg"
                >
                  ✕
                </button>
                <div className="flex border-b border-slate-700 pb-3 mb-4">
                  <div className="w-16 h-16 border border-slate-500 bg-black flex items-center justify-center font-black text-2xl">
                    {selectedOperator.name[0]}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-bold text-white">{selectedOperator.name}</h2>
                    <p className={`text-xs ${theme.accent}`}>{selectedOperator.role}</p>
                  </div>
                </div>
                
                {/* 醫療與傷情系統 (TCCC MARCH 展示區) */}
                <div className="flex-1 grid grid-cols-2 gap-4 text-xs">
                  <div className="border border-slate-700 p-3 bg-black/30">
                    <span className="text-red-500 font-bold block mb-1">[ MARCH 傷情診斷 ]</span>
                    {selectedOperator.status === 'injured' && (
                      <p className="text-yellow-400">⚠️ 右臂中彈：射擊天賦受到輕微扣分。外觀觀察：輕微滲血。</p>
                    )}
                    {selectedOperator.status === 'critical' && (
                      <p className="text-red-500 animate-pulse">🚨 M - 大出血 (股動脈破裂)：剩餘意識時間 3 回合！未經檢傷 (Triage) 無法確診隱藏傷情！外觀觀察：臉色極度蒼白、呼吸急促。</p>
                    )}
                    {selectedOperator.status === 'normal' && (
                      <p className="text-slate-500">生理機能完美。無可見創傷。</p>
                    )}
                  </div>
                  <div className="border border-slate-700 p-3 bg-black/30">
                    <span className="text-blue-400 font-bold block mb-1">[ 醫療處置背包 ]</span>
                    <button className="w-full bg-slate-800 border border-slate-600 py-1 mb-2 rounded text-left px-2 hover:bg-slate-700">
                      🩺 執行戰術檢傷 (耗費 2 回合)
                    </button>
                    <button className="w-full bg-slate-800 border border-slate-600 py-1 rounded text-left px-2 hover:bg-slate-700">
                      🩹 施打止血帶 TQ (耗費 4 回合)
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-[11px] text-slate-500 text-center">
                  提示：可使用鍵盤左右鍵 ◀ / ▶ 切換名單中的其他隊員卡。
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 底部計畫工具欄 */}
      <footer className={`h-20 border-t ${theme.border} ${theme.panelBg} flex justify-between items-center px-6 z-10`}>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 mr-2">移動配速:</span>
          <button className="px-3 py-1.5 border border-red-600 bg-red-950/30 text-red-500 text-xs font-bold rounded hover:bg-red-600 hover:text-white transition-colors">
            RUN (衝刺)
          </button>
          <button className="px-3 py-1.5 border border-yellow-500 bg-yellow-950/30 text-yellow-500 text-xs font-bold rounded hover:bg-yellow-500 hover:text-white transition-colors">
            DYNAMIC (推進)
          </button>
          <button className="px-3 py-1.5 border border-green-500 bg-green-950/20 text-green-400 text-xs font-bold rounded bg-green-500/10 hover:bg-green-500 hover:text-white transition-colors">
            DELIBERATE (步步為營)
          </button>
        </div>

        {/* 執行按鈕 */}
        <div>
          <button 
            onClick={handleExecute}
            className={`px-8 py-3 text-sm tracking-widest uppercase transition-all shadow-lg active:scale-95 ${theme.btn} hover:opacity-90`}
          >
            EXECUTE (執行規劃)
          </button>
        </div>
      </footer>

    </div>
  );
}

export default App;