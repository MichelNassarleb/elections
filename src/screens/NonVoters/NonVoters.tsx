import React, { useEffect, useState } from 'react';
import {
    getDatabase,
    ref,
    onValue,
} from 'firebase/database';
import { app } from '../../App';
import './NonVoters.css'; // Reusing same CSS
import '../Voters/VotersScreen.css'; // Reusing same CSS

export const NonVotersScreen = () => {
    const [voters, setVoters] = useState<Record<string, any>>({});
    const [filtered, setFiltered] = useState<Record<string, any>>({});
    const [filterText, setFilterText] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const db = getDatabase(app);
        const votersRef = ref(db, '/voters');

        onValue(votersRef, (snapshot) => {
            const data = snapshot.val() || {};
            const nonVoters = Object.fromEntries(
                Object.entries(data).filter(([_, voter]: any) => voter.has_voted === '0')
            );
            setVoters(nonVoters);
            setFiltered(nonVoters);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        const result = Object.fromEntries(
            Object.entries(voters).filter(([_, voter]) =>
                `${voter.first_name} ${voter.last_name}`.toLowerCase().includes(filterText.toLowerCase())
            )
        );
        setFiltered(result);
    }, [filterText, voters]);

    return (
        <div className="voters-container">
            <h2 className="voters-title">🚫 Not Voted</h2>
            <input
                type="text"
                placeholder="Search by name..."
                className="search-input"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
            />

            {loading ? (
                <div className="spinner">Loading...</div>
            ) : (
                <div className="table-wrapper">
                    <table className="voters-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Father</th>
                                <th>Mother</th>
                                <th>Reg. #</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(filtered)
                                .sort(([, a], [, b]) =>
                                    parseInt(a.registrat_number, 10) - parseInt(b.registrat_number, 10)
                                )
                                .map(([key, voter]) => (
                                    <tr key={key} className="non-clickable-row">
                                        <td>{voter.first_name} {voter.last_name}</td>
                                        <td>{voter.father_name}</td>
                                        <td>{voter.mother_name}</td>
                                        <td>{voter.registrat_number}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
