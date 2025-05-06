import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { app } from '../../App';
import './VoteDetails.css';

export const VoteDetails = () => {
    const { voterId } = useParams();
    const [voter, setVoter] = useState<any>(null);
    const [candidates, setCandidates] = useState<Record<string, any>>({});

    useEffect(() => {
        const db = getDatabase(app);

        // Get voter info
        onValue(ref(db, `/voters/${voterId}`), (snapshot) => {
            setVoter(snapshot.val());
        });

        // Get all candidates
        onValue(ref(db, '/candidatesBaladiyye'), (snapshot) => {
            setCandidates(snapshot.val() || {});
        });
    }, [voterId]);

    const grouped = Object.entries(candidates).reduce((acc: any, [key, candidate]: [string, any]) => {
        const list = candidate.list;
        if (!acc[list]) acc[list] = [];
        acc[list].push({ ...candidate, key });
        return acc;
    }, {});

    const handleCheckboxToggle = (key: string, isChecked: boolean, currentValue: number = 0) => {
        const db = getDatabase(app);
        const newValue = Math.max(0, currentValue + (isChecked ? 1 : -1));
        update(ref(db, `/candidatesBaladiyye/${key}`), { forecast_result_count: newValue });
    };

    return (
        <div className="vote-details">
            {voter ? (
                <>
                    <h1 className="voter-name">{voter.first_name} {voter.last_name}</h1>
                    {Object.entries(grouped).map(([listName, members]: any) => {
                        const makhtara = members.filter((m: any) => m.type === 'makhtara');
                        const baladiyye = members.filter((m: any) => m.type === 'baladiyye');

                        return (
                            <div key={listName} className="list-table">
                                <h2>List {listName}</h2>

                                {makhtara.length > 0 && (
                                    <>
                                        <h3>Makhtara</h3>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Forecast</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {makhtara.map((m: any) => (
                                                    <tr key={m.key}>
                                                        <td>{m.name}</td>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={!!m.forecast_result_count}
                                                                onChange={(e) =>
                                                                    handleCheckboxToggle(m.key, e.target.checked, m.forecast_result_count || 0)
                                                                }
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </>
                                )}

                                {baladiyye.length > 0 && (
                                    <>
                                        <h3>Baladiyye</h3>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Forecast</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {baladiyye.map((m: any) => (
                                                    <tr key={m.key}>
                                                        <td>{m.name}</td>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={!!m.forecast_result_count}
                                                                onChange={(e) =>
                                                                    handleCheckboxToggle(m.key, e.target.checked, m.forecast_result_count || 0)
                                                                }
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </>
                                )}
                            </div>
                        );
                    })}

                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};
