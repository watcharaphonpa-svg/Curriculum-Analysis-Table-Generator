
import React, { useState, useMemo } from 'react';
import { Behavior, Unit, MatrixData, CurriculumMetadata } from './types.ts';
import { calculatePriority, scaleMatrix } from './utils/calculations.ts';

const INITIAL_BEHAVIORS: Behavior[] = [
  { id: 'b1', name: 'ความรู้', isCognitive: true },
  { id: 'b2', name: 'ความเข้าใจ', isCognitive: true },
  { id: 'b3', name: 'นำไปใช้', isCognitive: true },
  { id: 'b4', name: 'วิเคราะห์', isCognitive: true },
  { id: 'b5', name: 'ประเมินค่า', isCognitive: true },
  { id: 'b6', name: 'สร้างสรรค์', isCognitive: true },
  { id: 'b7', name: 'ทักษะพิสัย', isCognitive: false },
  { id: 'b8', name: 'จิตพิสัย', isCognitive: false },
  { id: 'b9', name: 'ประยุกต์ใช้', isCognitive: false },
];

const App: React.FC = () => {
  const [metadata, setMetadata] = useState<CurriculumMetadata>({
    code: '21910-2010',
    subject: 'การเขียนภาษาโปรแกรมคอมพิวเตอร์',
    credits: '3 หน่วยกิต',
    level: 'ปวช. 2',
    branch: 'เทคโนโลยีธุรกิจดิจิทัล / สมรรถนะวิชาชีพเฉพาะ'
  });

  const [behaviors, setBehaviors] = useState<Behavior[]>(INITIAL_BEHAVIORS);
  const [units, setUnits] = useState<Unit[]>([
    { id: 'u1', name: '1. พื้นฐานการเขียนโปรแกรมเชิงธุรกิจ', periods: 12 },
    { id: 'u2', name: '2. การประมวลผลข้อมูลและการตัดสินใจ', periods: 12 },
  ]);

  const [matrix, setMatrix] = useState<MatrixData>({});

  const handleCellChange = (unitId: string, behaviorId: string, val: string) => {
    const num = parseInt(val);
    if (isNaN(num)) {
      setMatrix(prev => {
        const next = { ...prev };
        if (next[unitId]) {
          const row = { ...next[unitId] };
          delete row[behaviorId];
          next[unitId] = row;
        }
        return next;
      });
      return;
    }
    const clamped = Math.min(10, Math.max(1, num));
    setMatrix(prev => ({
      ...prev,
      [unitId]: {
        ...(prev[unitId] || {}),
        [behaviorId]: clamped
      }
    }));
  };

  const addUnit = () => {
    const id = `u${Date.now()}`;
    setUnits(prev => [...prev, { id, name: `หน่วยที่ ${prev.length + 1}. `, periods: 0 }]);
  };

  const addBehavior = () => {
    const id = `b${Date.now()}`;
    const name = prompt('กรุณาระบุชื่อพฤติกรรม:');
    if (name) {
      setBehaviors(prev => [...prev, { id, name, isCognitive: true }]);
    }
  };

  const clearMatrix = () => {
    if (window.confirm('ยืนยันการลบข้อมูลตัวเลขทั้งหมดในตาราง?')) {
      setMatrix({});
    }
  };

  const removeUnit = (id: string) => {
    if (window.confirm('ต้องการลบหน่วยการเรียนรู้นี้ใช่หรือไม่?')) {
      setUnits(prev => prev.filter(u => u.id !== id));
      setMatrix(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const removeBehavior = (id: string) => {
    if (window.confirm('ต้องการลบพฤติกรรมนี้ใช่หรือไม่?')) {
      setBehaviors(prev => prev.filter(b => b.id !== id));
      setMatrix(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(uId => {
          const row = { ...next[uId] };
          delete row[id];
          next[uId] = row;
        });
        return next;
      });
    }
  };

  // --- ตารางที่ 1 ---
  const table1Rows = useMemo(() => units.map(unit => {
    const rowData = behaviors.map(b => matrix[unit.id]?.[b.id] || 0);
    const rowSum = rowData.reduce((a, b) => a + b, 0);
    return { unit, data: rowData, sum: rowSum };
  }), [units, behaviors, matrix]);

  const table1ColSums = useMemo(() => behaviors.map(b => units.reduce((sum, u) => sum + (matrix[u.id]?.[b.id] || 0), 0)), [units, behaviors, matrix]);
  const table1GrandTotal = table1ColSums.reduce((a, b) => a + b, 0);
  const table1RowPriorities = calculatePriority(table1Rows.map(r => r.sum));

  // --- ตารางที่ 2 (Cognitive เท่านั้น, รวม 100) ---
  const table2Behaviors = behaviors.filter(b => b.isCognitive);
  const table2Data = useMemo(() => {
    if (table1GrandTotal === 0 || units.length === 0 || table2Behaviors.length === 0) 
      return units.map(() => table2Behaviors.map(() => 0));
    
    // ดึงเฉพาะข้อมูลพุทธพิสัยจากตารางที่ 1
    const rawMatrix = units.map(u => table2Behaviors.map(b => matrix[u.id]?.[b.id] || 0));
    
    // ถ้าผลรวมพุทธพิสัยเป็น 0 ให้ส่งค่าว่าง
    const cognitiveTotal = rawMatrix.flat().reduce((a, b) => a + b, 0);
    if (cognitiveTotal === 0) return units.map(() => table2Behaviors.map(() => 0));

    return scaleMatrix(rawMatrix, 100, 10);
  }, [units, table2Behaviors, matrix, table1GrandTotal]);

  const table2Rows = useMemo(() => units.map((unit, i) => {
    const rowData = table2Data[i] || table2Behaviors.map(() => 0);
    return { unit, data: rowData, sum: rowData.reduce((a, b) => a + b, 0) };
  }), [units, table2Behaviors, table2Data]);

  const table2ColSums = useMemo(() => table2Behaviors.map((_, colIdx) => table2Data.reduce((sum, row) => sum + (row[colIdx] || 0), 0)), [table2Behaviors, table2Data]);
  const table2RowPriorities = calculatePriority(table2Rows.map(r => r.sum));

  // --- ตารางที่ 3 (รวม 60) ---
  const table3Data = useMemo(() => {
    if (table2Data.length === 0 || table2Behaviors.length === 0) return [];
    return scaleMatrix(table2Data, 60);
  }, [table2Data, table2Behaviors]);

  const table3Rows = useMemo(() => units.map((unit, i) => {
    const rowData = table3Data[i] || table2Behaviors.map(() => 0);
    return { unit, data: rowData, sum: rowData.reduce((a, b) => a + b, 0) };
  }), [units, table2Behaviors, table3Data]);

  const table3ColSums = useMemo(() => table2Behaviors.map((_, colIdx) => table3Data.reduce((sum, row) => sum + (row[colIdx] || 0), 0)), [table2Behaviors, table3Data]);
  const table3RowPriorities = calculatePriority(table3Rows.map(r => r.sum));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-['Sarabun'] antialiased py-6 px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">ระบบวิเคราะห์หลักสูตร</h1>
              <p className="text-sm text-slate-400 font-medium">จัดการภาระงานและวิเคราะห์สัดส่วนข้อสอบ</p>
            </div>
          </div>
          <button type="button" onClick={() => window.print()} className="group bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-xl shadow-indigo-100 active:scale-95">
            พิมพ์รายงาน
          </button>
        </header>

        {/* Controls Card */}
        <section className="no-print bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/60 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'รหัสวิชา', key: 'code' },
              { label: 'ชื่อวิชา', key: 'subject', span: 'lg:col-span-2' },
              { label: 'หน่วยกิต', key: 'credits' },
              { label: 'ระดับชั้น', key: 'level' },
              { label: 'สาขาวิชา / สมรรถนะ', key: 'branch', span: 'lg:col-span-3' },
            ].map((field) => (
              <div key={field.key} className={`${field.span || ''}`}>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block ml-1">{field.label}</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:bg-white focus:border-indigo-600 outline-none transition font-bold"
                  value={(metadata as any)[field.key]} 
                  onChange={e => setMetadata({...metadata, [field.key]: e.target.value})} 
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={addUnit} className="px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm">+ เพิ่มหน่วยการเรียน</button>
            <button type="button" onClick={addBehavior} className="px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm">+ เพิ่มพฤติกรรม</button>
            <div className="flex-1"></div>
            <button type="button" onClick={clearMatrix} className="px-6 py-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl font-bold transition-all border border-rose-100">ล้างตัวเลขทั้งหมด</button>
          </div>
        </section>

        {/* Tables Section */}
        <div className="space-y-16">
          
          {/* Table 1: Base Table */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-8 pb-4 text-center">
              <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-3">Table 01</span>
              <h2 className="text-3xl font-black text-slate-900">ตารางวิเคราะห์หลักสูตร</h2>
            </div>
            <div className="p-8 overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th rowSpan={3} className="p-6 min-w-[320px] text-left border border-slate-100 rounded-tl-3xl font-black text-slate-900 uppercase">หัวข้อหน่วยการเรียนรู้</th>
                    <th colSpan={behaviors.length} className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 border border-slate-100">Behavioral Domains</th>
                    <th rowSpan={3} className="p-3 w-20 border border-slate-100 font-black text-[10px] uppercase text-slate-400">Total</th>
                    <th rowSpan={3} className="p-3 w-20 border border-slate-100 font-black text-[10px] uppercase text-slate-400">Rank</th>
                    <th rowSpan={3} className="p-3 w-24 border border-slate-100 rounded-tr-3xl font-black text-[10px] uppercase text-slate-400">Periods</th>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <th colSpan={behaviors.length} className="p-2 text-[10px] font-bold border border-slate-100 text-slate-400 uppercase tracking-widest text-center">Cognitive | Psychomotor | Affective</th>
                  </tr>
                  <tr className="bg-white">
                    {behaviors.map(b => (
                      <th key={b.id} className="p-0 font-bold text-[11px] h-48 relative group border border-slate-100 bg-white/50 w-12 min-w-[48px]">
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                            <button type="button" onClick={() => removeBehavior(b.id)} className="bg-rose-500 text-white p-1 rounded-full hover:bg-rose-600 shadow-lg"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg></button>
                        </div>
                        <div className="rotate-up absolute inset-0 flex items-center justify-center font-black text-slate-600 pointer-events-none">
                          <span className="whitespace-nowrap translate-y-[-10px]">{b.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {table1Rows.map((row, rIdx) => (
                    <tr key={row.unit.id} className="group hover:bg-indigo-50/30 transition-colors">
                      <td className="p-4 text-left border border-slate-100">
                        <div className="flex items-center gap-4 w-full">
                          <textarea rows={2} className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-left resize-none font-bold text-slate-700 outline-none" value={row.unit.name} onChange={e => {
                              const newUnits = [...units];
                              newUnits[rIdx].name = e.target.value;
                              setUnits(newUnits);
                            }} />
                          <button type="button" onClick={() => removeUnit(row.unit.id)} className="no-print shrink-0 text-rose-200 hover:text-rose-500 opacity-0 group-hover:opacity-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                        </div>
                      </td>
                      {behaviors.map((b) => (
                        <td key={b.id} className="p-0 border border-slate-100">
                          <input type="number" min="1" max="10" className="w-full h-14 text-center bg-transparent focus:bg-white outline-none font-black" value={matrix[row.unit.id]?.[b.id] || ''} onChange={e => handleCellChange(row.unit.id, b.id, e.target.value)} />
                        </td>
                      ))}
                      <td className="p-3 font-black bg-slate-50 text-indigo-600 text-lg border border-slate-100 text-center">{row.sum || '-'}</td>
                      <td className="p-3 font-black bg-slate-50/50 text-amber-500 border border-slate-100 text-center">{table1RowPriorities[rIdx]}</td>
                      <td className="p-0 border border-slate-100">
                        <input type="number" className="w-full h-14 text-center bg-transparent outline-none font-bold text-slate-500" value={row.unit.periods || ''} onChange={e => {
                            const newUnits = [...units];
                            newUnits[rIdx].periods = parseInt(e.target.value) || 0;
                            setUnits(newUnits);
                          }} />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 text-white font-black">
                    <td className="p-6 text-left rounded-bl-3xl">Grand Total</td>
                    {table1ColSums.map((sum, i) => <td key={i} className="p-3 border border-slate-800 text-center">{sum || '-'}</td>)}
                    <td className="p-3 text-xl bg-indigo-500 text-white border border-slate-800 text-center">{table1GrandTotal || '-'}</td>
                    <td colSpan={2} className="rounded-br-3xl bg-slate-900"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Normalized to 100 */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden print-break">
            <div className="p-8 pb-4 text-center">
              <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-3">Table 02</span>
              <h2 className="text-3xl font-black text-slate-900">น้ำหนักคะแนน (ฐาน 100)</h2>
            </div>
            <div className="p-8 overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th rowSpan={2} className="p-6 text-left border border-slate-800 rounded-tl-3xl min-w-[320px]">Unit / Topic</th>
                    <th colSpan={table2Behaviors.length} className="p-4 text-[10px] font-black uppercase tracking-widest border border-slate-800 text-center">Cognitive Weights (Scaled)</th>
                    <th rowSpan={2} className="p-3 w-20 border border-slate-800 text-[10px] font-black uppercase text-center">Total</th>
                    <th rowSpan={2} className="p-3 w-20 border border-slate-800 text-[10px] font-black uppercase text-center">Rank</th>
                    <th rowSpan={2} className="p-3 w-24 border border-slate-800 rounded-tr-3xl text-[10px] font-black uppercase text-center">Periods</th>
                  </tr>
                  <tr className="bg-slate-800">
                    {table2Behaviors.map(b => (
                      <th key={b.id} className="p-0 font-bold text-[10px] h-40 border border-slate-700 relative w-12 min-w-[48px]">
                        <div className="rotate-up absolute inset-0 flex items-center justify-center font-bold text-slate-300">
                          <span className="whitespace-nowrap translate-y-[-5px]">{b.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table2Rows.map((row, rIdx) => (
                    <tr key={row.unit.id} className="hover:bg-slate-50">
                      <td className="p-4 text-left font-bold text-slate-600 border border-slate-100">{row.unit.name}</td>
                      {row.data.map((val, bIdx) => (
                        <td key={bIdx} className="p-3 font-bold text-slate-500 border border-slate-100 text-center">{val || '-'}</td>
                      ))}
                      <td className="p-3 font-black bg-emerald-50 text-emerald-600 text-lg border border-slate-100 text-center">{row.sum}</td>
                      <td className="p-3 font-black text-amber-500 border border-slate-100 text-center">{table2RowPriorities[rIdx]}</td>
                      <td className="p-3 text-slate-400 border border-slate-100 text-center">{row.unit.periods}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 text-white font-black">
                    <td className="p-6 text-left rounded-bl-3xl">Summary Weight</td>
                    {table2ColSums.map((sum, i) => <td key={i} className="p-3 border border-slate-800 text-center">{sum}</td>)}
                    <td className="p-3 text-xl bg-emerald-500 border border-slate-800 text-center">100</td>
                    <td colSpan={2} className="rounded-br-3xl"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 3: Final Item Counts to 60 */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden print-break">
            <div className="p-8 pb-4 text-center">
              <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-3">Table 03</span>
              <h2 className="text-3xl font-black text-slate-900">จำนวนข้อสอบที่ใช้จริง (ฐาน 60)</h2>
            </div>
            <div className="p-8 overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th rowSpan={2} className="p-6 text-left border border-blue-500 rounded-tl-3xl min-w-[320px]">Unit / Topic</th>
                    <th colSpan={table2Behaviors.length} className="p-4 text-[10px] font-black uppercase tracking-widest border border-blue-500 text-center">Number of Questions</th>
                    <th rowSpan={2} className="p-3 w-20 border border-blue-500 text-[10px] font-black uppercase text-center">Items</th>
                    <th rowSpan={2} className="p-3 w-20 border border-blue-500 text-[10px] font-black uppercase text-center">Rank</th>
                    <th rowSpan={2} className="p-3 w-24 border border-blue-500 rounded-tr-3xl text-[10px] font-black uppercase text-center">Periods</th>
                  </tr>
                  <tr className="bg-blue-700">
                    {table2Behaviors.map(b => (
                      <th key={b.id} className="p-0 font-bold text-[10px] h-40 border border-blue-600 relative w-12 min-w-[48px]">
                        <div className="rotate-up absolute inset-0 flex items-center justify-center font-bold text-blue-100">
                          <span className="whitespace-nowrap translate-y-[-5px]">{b.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table3Rows.map((row, rIdx) => (
                    <tr key={row.unit.id} className="hover:bg-blue-50">
                      <td className="p-4 text-left font-bold text-slate-700 border border-slate-100">{row.unit.name}</td>
                      {row.data.map((val, bIdx) => (
                        <td key={bIdx} className="p-3 font-bold text-slate-500 border border-slate-100 text-center">{val || '-'}</td>
                      ))}
                      <td className="p-3 font-black bg-blue-50 text-blue-700 text-lg border border-slate-100 text-center">{row.sum}</td>
                      <td className="p-3 font-black text-amber-500 border border-slate-100 text-center">{table3RowPriorities[rIdx]}</td>
                      <td className="p-3 text-slate-400 border border-slate-100 text-center">{row.unit.periods}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 text-white font-black">
                    <td className="p-6 text-left rounded-bl-3xl">Total Questions</td>
                    {table3ColSums.map((sum, i) => <td key={i} className="p-3 border border-slate-800 text-center">{sum}</td>)}
                    <td className="p-3 text-xl bg-blue-600 border border-slate-800 text-center">60</td>
                    <td colSpan={2} className="rounded-br-3xl"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
      <style>{`
        .rotate-up { transform: rotate(-90deg); transform-origin: center center; white-space: nowrap; }
        input[type='number']::-webkit-inner-spin-button, input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type='number'] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
};

export default App;
