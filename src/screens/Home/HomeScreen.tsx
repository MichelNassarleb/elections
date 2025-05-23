import React, { useEffect, useState } from 'react';
import {
  getDatabase,
  ref,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  get,
  update,
  onValue,
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

type UpdateAction = {
  key: string;
  delta: number;
};

export const HomeScreen = () => {
  const [records, setRecords] = useState<Record<string, RecordType>>({});
  const [accessLevel, setAccessLevel] = useState<'full' | 'makhtara' | 'baladiyye' | 'chartsOnly' | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const [password, setPassword] = useState('');

  const [targetVotesMakhtara, setTargetVotesMakhtara] = useState<number | null>(null);
  const [targetVotesBaladiyye, setTargetVotesBaladiyye] = useState<number | null>(null);
  const [inputMakhtara, setInputMakhtara] = useState('');
  const [inputBaladiyye, setInputBaladiyye] = useState('');

  const pendingUpdates: UpdateAction[] = [];
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const db = getDatabase(app);
    const recordsRef = ref(db, '/candidatesBaladiyye');
    const settingsRef = ref(db, '/settings');

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

    onValue(settingsRef, snapshot => {
      const settings = snapshot.val() || {};
      if (typeof settings.targetVotesMakhtara === 'number') {
        setTargetVotesMakhtara(settings.targetVotesMakhtara);
        setInputMakhtara(String(settings.targetVotesMakhtara));
      }
      if (typeof settings.targetVotesBaladiyye === 'number') {
        setTargetVotesBaladiyye(settings.targetVotesBaladiyye);
        setInputBaladiyye(String(settings.targetVotesBaladiyye));
      }
    });

    const connRef = ref(db, '.info/connected');
    const unsubscribe = onValue(connRef, snap => {
      const connected = !!snap.val();
      setIsOnline(connected);
      if (connected) processPendingUpdates();
    });

    return () => unsubscribe();
  }, []);

  const vibrate = (ms = 50) => {
    if (navigator.vibrate) navigator.vibrate(ms);
  };

  const updateCount = (key: string, delta: number) => {
    const type = records[key]?.type;
    if (
      !accessLevel ||
      accessLevel === 'chartsOnly' ||
      (accessLevel === 'makhtara' && type !== 'makhtara') ||
      (accessLevel === 'baladiyye' && type !== 'baladiyye')
    ) return;

    const db = getDatabase(app);
    const current = records[key]?.count || 0;
    const updatedCount = Math.max(0, current + delta);

    update(ref(db, `/candidatesBaladiyye/${key}`), { count: updatedCount }).catch(() => {
      console.warn('Offline, queuing update:', key, delta);
      pendingUpdates.push({ key, delta });
    });
  };

  const processPendingUpdates = () => {
    const merged: Record<string, number> = {};
    for (const { key, delta } of pendingUpdates) {
      merged[key] = (merged[key] || 0) + delta;
    }
    pendingUpdates.length = 0;
    for (const key in merged) {
      if (merged[key] !== 0) {
        updateCount(key, merged[key]);
      }
    }
  };

  const handlePasswordSubmit = () => {
    switch (password) {
      case '123456':
        setAccessLevel('makhtara');
        break;
      case '654321':
        setAccessLevel('baladiyye');
        break;
      case '999000':
        setAccessLevel('chartsOnly');
        break;
      default:
        alert('wrong password');
        return;
    }
    setShowPasswordModal(false);
  };

  const setTargetVotes = (type: 'makhtara' | 'baladiyye', val: string) => {
    const value = parseInt(val);
    if (!isNaN(value) && value > 0) {
      const db = getDatabase(app);
      update(ref(db, '/settings'), {
        [type === 'makhtara' ? 'targetVotesMakhtara' : 'targetVotesBaladiyye']: value,
      });

      if (type === 'makhtara') {
        setInputMakhtara(val);
        setTargetVotesMakhtara(value);
      } else {
        setInputBaladiyye(val);
        setTargetVotesBaladiyye(value);
      }
    } else {
      if (type === 'makhtara') setInputMakhtara(val);
      else setInputBaladiyye(val);
    }
  };

  const listNames = Array.from(new Set(Object.values(records).map(r => r.list))).sort();

  const renderListRow = (type: 'makhtara' | 'baladiyye', listName: string) => {
    if (
      accessLevel === 'chartsOnly' ||
      (type === 'makhtara' && accessLevel === 'baladiyye') ||
      (type === 'baladiyye' && accessLevel === 'makhtara') ||
      accessLevel === null
    ) return null;

    const data = Object.entries(records).filter(
      ([, val]) => val.list === listName && val.type === type
    );

    if (data.length === 0) return null;

    const incrementAll = () => {
      data.forEach(([key]) => updateCount(key, 1));
      vibrate(100);
    };

    const decrementAll = () => {
      data.forEach(([key]) => updateCount(key, -1));
      vibrate(100);
    };

    return (
      <div className="list-row" key={`${type}-${listName}`}>
        <div className="list-title-bar">
          <h4 className="list-title">{type} - List {listName}</h4>
          {(accessLevel === 'full' || accessLevel === type) && (
            <div className="all-buttons">
              <button className="btn small-all plus-all" onClick={incrementAll}>+ All</button>
              <button className="btn small-all minus-all" onClick={decrementAll}>– All</button>
            </div>
          )}
        </div>
        <div className="row-flex">
          {data.map(([key, value]) => (
            <div className="candidate-box" key={key}>
              <span
                className="candidate-name"
                onClick={() => {
                  updateCount(key, 1);
                  vibrate();
                }}
              >
                {value.name}
              </span>
              {(accessLevel === 'full' || accessLevel === value.type) && (
                <div className="button-group horizontal">
                  <button className="big-btn minus" onClick={() => { updateCount(key, -1); vibrate(); }}>–</button>
                  <span className="candidate-count">{value.count || 0}</span>
                  <button className="big-btn plus" onClick={() => { updateCount(key, 1); vibrate(); }}>+</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const makhtaraData = Object.values(records)
    .filter(r => r.type === 'makhtara')
    .map(r => {
      const count = r.count || 0;
      const threshold = targetVotesMakhtara ? Math.floor(targetVotesMakhtara / 2) + 1 : null;
      return {
        name: r.name,
        count,
        list: r.list,
        won: threshold !== null && count >= threshold,
      };
    })
    .sort((a, b) => b.count - a.count);

  const baladiyyeData = Object.values(records)
    .filter(r => r.type === 'baladiyye')
    .map(r => {
      const count = r.count || 0;
      const threshold = targetVotesBaladiyye ? Math.floor(targetVotesBaladiyye / 2) + 1 : null;
      return {
        name: r.name,
        count,
        list: r.list,
        won: threshold !== null && count >= threshold,
      };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <>
      <div className={`homescreen ${accessLevel === 'chartsOnly' ? 'none' : ''}`}>
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

        {accessLevel === 'makhtara' && (
          <div className="target-input">
            <label>Total Votes (Makhtara):</label>
            <input
              type="number"
              value={inputMakhtara}
              onChange={e => setTargetVotes('makhtara', e.target.value)}
              placeholder="e.g. 400"
            />
          </div>
        )}

        {accessLevel === 'baladiyye' && (
          <div className="target-input">
            <label>Total Votes (Baladiyye):</label>
            <input
              type="number"
              value={inputBaladiyye}
              onChange={e => setTargetVotes('baladiyye', e.target.value)}
              placeholder="e.g. 500"
            />
          </div>
        )}

        <div className="list-block">
          {listNames.map(name => renderListRow('makhtara', name))}
          {listNames.map(name => renderListRow('baladiyye', name))}
        </div>
      </div>

      {(accessLevel !== null) && (
        <>
          <div className="chart-wrapper">
            <h2 className="chart-title">Makhtara Chart</h2>
            <h3>{`Total votes: ${targetVotesMakhtara || 0}`}</h3>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={makhtaraData} margin={{ top: 20, right: 20, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" isAnimationActive={false}>
                  {makhtaraData.map((entry, index) => (
                    <Cell key={`m-cell-${index}`} fill={entry.won ? 'green' : (entry.list === '1' ? '#e53935' : '#fdd835')} />
                  ))}
                  <LabelList dataKey="count" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-wrapper">
            <h2 className="chart-title">Baladiyye Chart</h2>
            <h3>{`Total votes: ${targetVotesBaladiyye || 0}`}</h3>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={baladiyyeData} margin={{ top: 20, right: 20, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" isAnimationActive={false}>
                  {baladiyyeData.map((entry, index) => (
                    <Cell key={`b-cell-${index}`} fill={entry.won ? 'green' : (entry.list === '1' ? '#e53935' : '#fdd835')} />
                  ))}
                  <LabelList dataKey="count" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </>
  );
};
