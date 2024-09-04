import React, { useState, useEffect } from 'react';
import HomeNavbar from '../Components/navbar/Navbar';
import { Table, Form, Container } from 'react-bootstrap'; // Make sure you have react-bootstrap installed
import axios from 'axios'; // Ensure you have axios installed
import { useNavigate } from 'react-router-dom';
import './style.css';

const Blocklist = () => {
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
            axios.get(`/api/phonebook/get-blocked-numbers`, {
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
        // Filter numbers based on search query
        if (searchQuery) {
            setFilteredNumbers(blockedNumbers.filter(entry =>
                entry.number.includes(searchQuery) || entry.status.includes(searchQuery)
            ));
        } else {
            setFilteredNumbers(blockedNumbers);
        }
    }, [searchQuery, blockedNumbers]);

    return (
        <div>
            <HomeNavbar />
            <Container>

                <div className="phonebook-container">

                    <div style={{ width: '100%', maxWidth: '1500px', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }} >
                        <Form.Group controlId="searchBar" className='w-50'>
                            <Form.Control
                                type="text"
                                placeholder="Search by Number"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </Form.Group>
                    </div>

                    {filteredNumbers.length > 0 ? (
                        <div  >
                            <Table hover bordered responsive className='mt-3 table_main_container' size='md' >
                                <thead className='table_head' style={{ backgroundColor: '#f8f9fd' }}>
                                    <tr 
                                    className="teble_tr_class"
                                    style={{
                                        backgroundColor: '#e9ecef', // Light background color for the row
                                        color: '#343a40', // Dark text color
                                        borderBottom: '2px solid #dee2e6', // Bottom border for rows
                                        transition: 'background-color 0.3s ease', // Smooth transition for hover effect
                                    }}
                                    >
                                        <th style={{ backgroundColor: '#f8f9fd' }} className="equal-width">Number</th>
                                        <th style={{ backgroundColor: '#f8f9fd' }} className="equal-width">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredNumbers.map((entry, index) => (
                                        <tr key={index}>
                                            <td   className='table_td_class' style={{ textAlign: 'center' }}>{entry.number}</td>
                                            <td   className='table_td_class' style={{ textAlign: 'center' }}>{entry.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    ) : (
                        <p>No Blocked Numbers Available.</p>
                    )}
                </div>
            </Container>
        </div>
    );
};

export default Blocklist;