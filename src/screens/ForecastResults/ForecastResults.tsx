import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../../App';
import './ForecastResults.css';

export const ForecastResults = () => {
  const [candidates, setCandidates] = useState<Record<string, any>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const db = getDatabase(app);
    const refPath = ref(db, '/candidatesBaladiyye');
    onValue(refPath, (snapshot) => {
      const data = snapshot.val() || {};
      setCandidates(data);
    });
  }, []);

  const grouped = Object.entries(candidates).reduce((acc: any, [key, value]: [string, any]) => {
    const list = value.list;
    if (!acc[list]) acc[list] = [];
    acc[list].push({ ...value, key });
    return acc;
  }, {});

  return (
    <div className="forecast-container">
      <div className="header-bar">
        <h1 className="page-title">📊 Forecast Results</h1>
        <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
      </div>
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
                  <div className="count-box">Votes: <strong>{item.forecast_result_count || 0}</strong></div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};