import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { app } from '../../App';
import './VoteDetails.css';

type Candidate = {
    key: string;
    name: string;
    type: 'makhtara' | 'baladiyye';
    list: string;
    forecast_result_count?: number;
};

type ForecastTableProps = {
    label: string;
    list: Candidate[];
    voterVotes: Record<string, boolean>;
    candidates: Record<string, Candidate>;
    voterId: string;
    onToggle: (key: string, checked: boolean) => void;
};

const ForecastTable: React.FC<ForecastTableProps> = ({
    label,
    list,
    voterVotes,
    candidates,
    voterId,
    onToggle,
}) => {
    const checkboxRef = useRef<HTMLInputElement>(null);
    const allChecked = list.every((m) => voterVotes[m.key]);
    const someChecked = list.some((m) => voterVotes[m.key]);

    useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = !allChecked && someChecked;
        }
    }, [allChecked, someChecked]);

    const handleToggleAll = (checked: boolean) => {
        const db = getDatabase(app);
        const updates: Record<string, any> = {};

        list.forEach((m) => {
            const wasChecked = voterVotes[m.key];
            updates[`votes/${voterId}/${m.key}`] = checked ? true : null;

            const current = candidates[m.key]?.forecast_result_count || 0;
            const diff = checked && !wasChecked ? 1 : !checked && wasChecked ? -1 : 0;
            updates[`candidatesBaladiyye/${m.key}/forecast_result_count`] = Math.max(0, current + diff);
        });

        update(ref(db), updates);
    };

    return (
        <>
            <div className="section-header">
                <h3>{label}</h3>
                <label className="select-all-label">
                    <input
                        ref={checkboxRef}
                        type="checkbox"
                        checked={allChecked}
                        onChange={(e) => handleToggleAll(e.target.checked)}
                    />
                    Select All
                </label>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Forecast</th>
                    </tr>
                </thead>
                <tbody>
                    {list.map((m) => (
                        <tr key={m.key}>
                            <td>{m.name}</td>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={!!voterVotes[m.key]}
                                    onChange={(e) => onToggle(m.key, e.target.checked)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
};

export const VoteDetails = () => {
    const { voterId } = useParams();
    const [voter, setVoter] = useState<any>(null);
    const [candidates, setCandidates] = useState<Record<string, Candidate>>({});
    const [voterVotes, setVoterVotes] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const db = getDatabase(app);

        onValue(ref(db, `/voters/${voterId}`), (snapshot) => {
            setVoter(snapshot.val());
        });

        onValue(ref(db, '/candidatesBaladiyye'), (snapshot) => {
            const raw = snapshot.val() || {};
            const parsed: Record<string, Candidate> = {};
            Object.entries(raw).forEach(([key, value]) => {
                parsed[key] = { ...value as any, key } as Candidate;
            });
            setCandidates(parsed);
        });

        onValue(ref(db, `/votes/${voterId}`), (snapshot) => {
            setVoterVotes(snapshot.val() || {});
        });
    }, [voterId]);

    const handleCheckboxToggle = (key: string, isChecked: boolean) => {
        const db = getDatabase(app);
        const current = candidates[key]?.forecast_result_count || 0;
        const newVal = Math.max(0, current + (isChecked ? 1 : -1));

        update(ref(db), {
            [`votes/${voterId}/${key}`]: isChecked ? true : null,
            [`candidatesBaladiyye/${key}/forecast_result_count`]: newVal,
        });
    };

    const grouped = Object.values(candidates).reduce((acc: any, candidate) => {
        const list = candidate.list;
        if (!acc[list]) acc[list] = [];
        acc[list].push(candidate);
        return acc;
    }, {});

    return (
        <div className="vote-details">
            {voter ? (
                <>
                    <h1 className="voter-name">
                        {voter.first_name} {voter.last_name}
                    </h1>
                    {Object.entries(grouped).map(([listName, members]: [any, any]) => {
                        const makhtara = members.filter((m: any) => m.type === 'makhtara');
                        const baladiyye = members.filter((m: any) => m.type === 'baladiyye');

                        return (
                            <div key={listName} className="list-table">
                                <h2>List {listName}</h2>
                                {makhtara.length > 0 && (
                                    <ForecastTable
                                        label="Makhtara"
                                        list={makhtara}
                                        voterVotes={voterVotes}
                                        candidates={candidates}
                                        voterId={voterId!}
                                        onToggle={handleCheckboxToggle}
                                    />
                                )}
                                {baladiyye.length > 0 && (
                                    <ForecastTable
                                        label="Baladiyye"
                                        list={baladiyye}
                                        voterVotes={voterVotes}
                                        candidates={candidates}
                                        voterId={voterId!}
                                        onToggle={handleCheckboxToggle}
                                    />
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
