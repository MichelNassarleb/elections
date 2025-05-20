import React, { useEffect, useState } from 'react';
import {
  getDatabase,
  ref,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  get,
  update,
} from 'firebase/database';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts';

import './HomeScreen.css';
import { app } from '../../App';

type RecordType = {
  name: string;
  count?: number;
  list: string;
  type: 'makhtara' | 'baladiyye';
};

export const HomeScreen = () => {
  const [records, setRecords] = useState<Record<string, RecordType>>({});
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const db = getDatabase(app);
    const recordsRef = ref(db, '/candidatesBaladiyye');

    get(recordsRef).then(snapshot => {
      if (snapshot.exists()) setRecords(snapshot.val());
    });

    onChildAdded(recordsRef, snapshot => {
      setRecords(prev => ({ ...prev, [snapshot.key!]: snapshot.val() }));
    });

    onChildChanged(recordsRef, snapshot => {
      setRecords(prev => ({ ...prev, [snapshot.key!]: snapshot.val() }));
    });

    onChildRemoved(recordsRef, snapshot => {
      setRecords(prev => {
        const updated = { ...prev };
        delete updated[snapshot.key!];
        return updated;
      });
    });
  }, []);

  const updateCount = (key: string, delta: number) => {
    if (!isAuthorized) return;
    const db = getDatabase(app);
    const currentCount = records[key]?.count || 0;
    const updatedCount = Math.max(0, currentCount + delta);
    update(ref(db, `/candidatesBaladiyye/${key}`), { count: updatedCount });
  };

  const handlePasswordSubmit = () => {
    if (password === '111222') setIsAuthorized(true);
    setShowPasswordModal(false);
  };

  const listNames = Array.from(new Set(Object.values(records).map(r => r.list))).sort();

  const handleIncrementAll = (type: 'makhtara' | 'baladiyye', list: string) => {
    const filtered = Object.entries(records).filter(
      ([, val]) => val.type === type && val.list === list
    );
    filtered.forEach(([key]) => {
      updateCount(key, 1);
    });
    if (navigator.vibrate) navigator.vibrate(100);
  };

  const renderListRow = (type: 'makhtara' | 'baladiyye', listName: string) => {
    const data = [...Object.entries(records).filter(
      ([, val]) => val.list === listName && val.type === type
    ), ...Object.entries(records).filter(
      ([, val]) => val.list === listName && val.type === type
    ), ...Object.entries(records).filter(
      ([, val]) => val.list === listName && val.type === type
    )]

    if (data.length === 0) return null;

    return (
      <div className="list-row" key={`${type}-${listName}`}>
        <div className="list-header">
          <h4>{type} - List {listName}</h4>
          {isAuthorized && (
            <button
              className="btn small-all"
              onClick={() => handleIncrementAll(type, listName)}
            >
              + All
            </button>
          )}
        </div>
        <div className="row-flex">
          {data.map(([key, value]) => (
            <div className="candidate-box" key={key}>
              <span
                className="candidate-name"
                onClick={() => {
                  updateCount(key, 1);
                  if (navigator.vibrate) navigator.vibrate(50);
                }}
              >
                {value.name}
              </span>
              <div className="button-group horizontal">
                <button
                  className="big-btn plus"
                  onClick={() => {
                    updateCount(key, 1);
                    if (navigator.vibrate) navigator.vibrate(50);
                  }}
                >
                  +
                </button>
                <span className="candidate-count">{value.count || 0}</span>
                <button
                  className="big-btn minus"
                  onClick={() => updateCount(key, -1)}
                >
                  –
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const makhtaraData = Object.values(records)
    .filter(r => r.type === 'makhtara')
    .map(r => ({ name: r.name, count: r.count || 0, list: r.list }))
    .sort((a, b) => b.count - a.count);

  const baladiyyeData = Object.values(records)
    .filter(r => r.type === 'baladiyye')
    .map(r => ({ name: r.name, count: r.count || 0, list: r.list }))
    .sort((a, b) => b.count - a.count);

  return (
    <>
      <div className="homescreen">
        <h1 className="title">Candidates</h1>

        {showPasswordModal && (
          <div className="modal-backdrop">
            <div className="modal">
              <h2>Enter Admin Password</h2>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="•••••••"
              />
              <button className="btn submit-btn" onClick={handlePasswordSubmit}>Submit</button>
            </div>
          </div>
        )}

        <div className="list-block">
          {listNames.map(name => renderListRow('makhtara', name))}
          {listNames.map(name => renderListRow('baladiyye', name))}
        </div>
      </div>

      {/* Makhtara Chart */}
      <div className="chart-wrapper">
        <h2 className="chart-title">Makhtara Chart</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={makhtaraData} margin={{ top: 20, right: 20, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" isAnimationActive={false}>
              {makhtaraData.map((entry, index) => (
                <Cell key={`m-cell-${index}`} fill={entry.list === '1' ? '#e53935' : '#fdd835'} />
              ))}
              <LabelList dataKey="count" position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Baladiyye Chart */}
      <div className="chart-wrapper">
        <h2 className="chart-title">Baladiyye Chart</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={baladiyyeData} margin={{ top: 20, right: 20, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" isAnimationActive={false}>
              {baladiyyeData.map((entry, index) => (
                <Cell key={`b-cell-${index}`} fill={entry.list === '1' ? '#e53935' : '#fdd835'} />
              ))}
              <LabelList dataKey="count" position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};
