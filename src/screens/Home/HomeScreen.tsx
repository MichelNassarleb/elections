import React, { useEffect, useState } from 'react';
import {
  getDatabase,
  ref,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  get,
  update
} from 'firebase/database';

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
      if (snapshot.exists()) {
        setRecords(snapshot.val());
      }
    });

    onChildAdded(recordsRef, snapshot => {
      setRecords(prev => ({
        ...prev,
        [snapshot.key!]: snapshot.val(),
      }));
    });

    onChildChanged(recordsRef, snapshot => {
      setRecords(prev => ({
        ...prev,
        [snapshot.key!]: snapshot.val(),
      }));
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

  const updateGroupCountByType = (listValue: string, type: 'makhtara' | 'baladiyye', delta: number) => {
    if (!isAuthorized) return;
    const db = getDatabase(app);
    const updates: Record<string, any> = {};

    Object.entries(records).forEach(([key, value]) => {
      if (value.list === listValue && value.type === type) {
        const currentCount = value.count || 0;
        updates[`/candidatesBaladiyye/${key}/count`] = Math.max(0, currentCount + delta);
      }
    });

    update(ref(db), updates);
  };

  const handlePasswordSubmit = () => {
    if (password === '111222') {
      setIsAuthorized(true);
    }
    setShowPasswordModal(false);
  };

  const renderSection = (title: 'Makhtara' | 'Baladiyye', data: [string, RecordType][], listName: string) => {
    return (
      <div className="subsection">
        <div className="subsection-header">
          <h3 className="subsection-title">{title}</h3>
          {isAuthorized && (
            <div className="group-buttons">
              <button
                className="btn plus"
                onClick={() => updateGroupCountByType(listName, title.toLowerCase() as 'makhtara' | 'baladiyye', 1)}
              >
                + All
              </button>
              <button
                className="btn minus"
                onClick={() => updateGroupCountByType(listName, title.toLowerCase() as 'makhtara' | 'baladiyye', -1)}
              >
                - All
              </button>
            </div>
          )}
        </div>
        {Object.keys(records).length === 0 ? (
          <div className="spinner-container">
            <div className="spinner" />
          </div>
        ) : (
          data.map(([key, value]) => (
            <div className="card" key={key}>
              <h3 className="name">{value.name}</h3>
              <p className="count">Count: {value.count || 0}</p>
              {isAuthorized && (
                <div className="buttons">
                  <button className="btn plus" onClick={() => updateCount(key, 1)}>+</button>
                  <button className="btn minus" onClick={() => updateCount(key, -1)}>-</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  const renderList = (listName: string) => {
    const filtered = Object.entries(records).filter(([_, val]) => val.list === listName);
    const makhtara = filtered.filter(([_, val]) => val.type === 'makhtara');
    const baladiyye = filtered.filter(([_, val]) => val.type === 'baladiyye');

    return (
      <div className="list-section" key={listName}>
        <div className="list-header">
          <h2 className="list-title">List {listName}</h2>
        </div>
        {renderSection('Makhtara', makhtara, listName)}
        {renderSection('Baladiyye', baladiyye, listName)}
      </div>
    );
  };

  const listNames = Array.from(new Set(Object.values(records).map(r => r.list))).sort();

  return (
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
              placeholder="Password"
            />
            <button className="btn submit-btn" onClick={handlePasswordSubmit}>Submit</button>
          </div>
        </div>
      )}

      <div className="column-container">
        {listNames.map(renderList)}
      </div>
    </div>
  );
};
