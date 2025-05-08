import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../../App';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import './ForecastResults.css';

export const ForecastResults = () => {
  const [candidates, setCandidates] = useState<Record<string, any>>({});
  const [showModal, setShowModal] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const db = getDatabase(app);
    const refPath = ref(db, '/candidatesBaladiyye');
    onValue(refPath, (snapshot) => {
      const data = snapshot.val() || {};
      setCandidates(data);
    });
  }, []);

  const handleSubmit = () => {
    if (password === '111222') {
      setShowModal(false);
      setError('');
    } else {
      setError('❌ Wrong password');
    }
  };

  const makhtaraData = Object.values(candidates)
    .filter((item: any) => item.type === 'makhtara')
    .map((item: any) => ({
      name: item.name,
      votes: item.forecast_result_count || 0,
    }))
    .sort((a, b) => b.votes - a.votes);

  const baladiyyeData = Object.values(candidates)
    .filter((item: any) => item.type === 'baladiyye')
    .map((item: any) => ({
      name: item.name,
      votes: item.forecast_result_count || 0,
    }))
    .sort((a, b) => b.votes - a.votes);
  const grouped = Object.entries(candidates).reduce((acc: any, [key, value]: [string, any]) => {
    const list = value.list;
    if (!acc[list]) acc[list] = [];
    acc[list].push({ ...value, key });
    return acc;
  }, {});
  return (
    <div className="forecast-container">
      {showModal ? (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Enter Password</h2>
            <input
              type="password"
              placeholder="•••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleSubmit}>Submit</button>
            {error && <p className="error-msg">{error}</p>}
          </div>
        </div>
      ) : (
        <>
          <div className="header-bar">
            <h1 className="page-title">📊 Forecast Results</h1>
            <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
          </div>

          <div className="chart-wrapper">
            <h2 className="chart-title">Makhtara Forecast</h2>
            <ResponsiveContainer width="100%" height={Math.max(300, makhtaraData.length * 50)}>
              <BarChart data={makhtaraData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis width={30} dataKey="name" type="category" />
                <Tooltip />
                <Bar dataKey="votes" fill="#28a745">
                  <LabelList dataKey="votes" position="right" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-wrapper">
            <h2 className="chart-title">Baladiyye Forecast</h2>
            <ResponsiveContainer width="100%" height={Math.max(300, baladiyyeData.length * 50)}>
              <BarChart data={baladiyyeData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis width={30} dataKey="name" type="category" />
                <Tooltip />
                <Bar dataKey="votes" fill="#007bff">
                  <LabelList dataKey="votes" position="right" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
      {Object.entries(grouped).map(([listName, items]: any) => (
        <div className="list-section" key={listName}>
          <h2 className="list-title">List {listName}</h2>
          <div className="grid-wrapper">
            {items
              .sort((a: any, b: any) => (b.forecast_result_count || 0) - (a.forecast_result_count || 0))
              .map((item: any) => (
                <div className="card" key={item.key}>
                  <h3 className="candidate-name">{item.name}</h3>
                  <p className="candidate-type">{item.type}</p>
                  <div className="count-box">
                    Votes: <strong>{item.forecast_result_count || 0}</strong>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};
