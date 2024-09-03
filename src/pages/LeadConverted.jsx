import React, { useState, useEffect } from 'react';
import HomeNavbar from '../Components/navbar/Navbar';
import { Table, Form, Container } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './style.css';

const LeadConverted = () => {
    const [blockedNumbers, setBlockedNumbers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredNumbers, setFilteredNumbers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('phoneUserData'));
        if (!userData || !userData.token) {
            navigate('/');
        } else {
            // Fetch blocked numbers from the API
            axios.get(`/api/phonebook/get-leads-numbers`, {
                headers: {
                    'Authorization': `Bearer ${userData.token}`,
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    setBlockedNumbers(response.data);
                    setFilteredNumbers(response.data); // Initialize filtered numbers
                })
                .catch(error => {
                    console.error('Error fetching blocked numbers:', error);
                });
        }
    }, [navigate]);

    useEffect(() => {
        // Filter numbers based on search query for both number and user name
        if (searchQuery) {
            const queryLower = searchQuery.toLowerCase();
            setFilteredNumbers(blockedNumbers.filter(entry =>
                entry.number.toLowerCase().includes(queryLower) ||
                entry.status.toLowerCase().includes(queryLower) ||
                (entry.user && entry.user.name && entry.user.name.toLowerCase().includes(queryLower))
            ));
        } else {
            setFilteredNumbers(blockedNumbers);
        }
    }, [searchQuery, blockedNumbers]);

    return (
        <div>
            <HomeNavbar />
            <Container fluid >
                <div className="phonebook-container">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                        <Form.Group controlId="searchBar" className='w-50'>
                            <Form.Control
                                type="text"
                                placeholder="Search by Number or User Name"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </Form.Group>
                    </div>

                    {filteredNumbers.length > 0 ? (
                        <Table striped bordered hover responsive className='mt-4'>
                            <thead className='table_head'>
                                <tr className='table_head'>
                                    <th className="equal-width">User</th>
                                    <th className="equal-width">Number</th>
                                    <th className="equal-width">Status</th>
                                    <th className="equal-width">Call Status</th>
                                    <th className="equal-width">Pipeline</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredNumbers.map((entry, index) => (
                                    <tr key={index}>
                                        <td style={{ textAlign: 'center' }}>
                                            {entry.user && entry.user.name ? entry.user.name : 'N/A'}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{entry.number}</td>
                                        <td style={{ textAlign: 'center' }}>{entry.status}</td>
                                        <td style={{ textAlign: 'center' }}>{entry.calstatus}</td>
                                        <td style={{ textAlign: 'center' }}>{entry.pipeline?.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <p>No Leads Numbers Available.</p>
                    )}
                </div>
            </Container>
        </div>
    );
};

export default LeadConverted;
