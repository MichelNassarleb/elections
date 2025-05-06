import React, { useEffect, useState } from 'react';
import {
    getDatabase,
    ref,
    onValue,
    update,
} from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { app } from '../../App';
import ClipLoader from 'react-spinners/ClipLoader';
import './VotersScreen.css';

export const VotersScreen = () => {
    const [voters, setVoters] = useState<Record<string, any>>({});
    const [filteredVoters, setFilteredVoters] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');


    const [showModal, setShowModal] = useState(() => {
        return localStorage.getItem('isAuthorized') !== 'true';
    });

    const navigate = useNavigate();

    useEffect(() => {
        const db = getDatabase(app);
        const votersRef = ref(db, '/voters');

        onValue(votersRef, (snapshot) => {
            const data = snapshot.val() || {};
            setVoters(data);
            setFilteredVoters(data);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        const filtered = Object.fromEntries(
            Object.entries(voters).filter(([_, voter]) =>
                `${voter.first_name} ${voter.last_name}`.includes(filterText)
            )
        );
        setFilteredVoters(filtered);
    }, [filterText, voters]);

    const handleVoteToggle = (key: string, currentValue: string) => {
        const db = getDatabase(app);
        const newVal = currentValue === '0' ? '1' : '0';
        update(ref(db, `/voters/${key}`), { has_voted: newVal });
    };

    const handlePasswordSubmit = () => {
        if (password === '111222') {
            localStorage.setItem('isAuthorized', 'true');
            setShowModal(false);
            setError('');
        } else {
            setError('❌ Wrong password');
        }
    };

    return (
        <div className="voters-container">
            {showModal && (
                <div className="modal modal1">
                    <div className="modal-content">
                        <h2>Enter Admin Password</h2>
                        <input
                            type="password"
                            placeholder="•••••••"
                            className="modal-input"
                            value={password}
                            autoFocus
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button onClick={handlePasswordSubmit} className="modal-button">
                            Enter
                        </button>
                        {error && <p className="modal-error">{error}</p>}
                    </div>
                </div>
            )}

            {!showModal && (
                <>
                    <h2 className="voters-title">🗳️ Voter List</h2>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        className="search-input"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />

                    {loading ? (
                        <div className="spinner">
                            <ClipLoader size={40} color="#007bff" loading={true} />
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="voters-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Father</th>
                                        <th>Mother</th>
                                        <th>Reg. #</th>
                                        <th>Has Voted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(filteredVoters)
                                        .sort(([, a], [, b]) => {
                                            const numA = parseInt(a.registrat_number, 10);
                                            const numB = parseInt(b.registrat_number, 10);
                                            return numA - numB;
                                        })
                                        .map(([key, voter]) => (
                                            <tr
                                                key={key}
                                                className="clickable-row"
                                                onClick={() => navigate(`/vote-details/${key}`)}
                                            >
                                                <td>{voter.first_name} {voter.last_name}</td>
                                                <td>{voter.father_name}</td>
                                                <td>{voter.mother_name}</td>
                                                <td>{voter.registrat_number}</td>
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={voter.has_voted === '1'}
                                                        onChange={() => handleVoteToggle(key, voter.has_voted)}
                                                        className="voter-checkbox"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
