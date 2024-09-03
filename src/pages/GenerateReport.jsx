import React, { useState, useEffect } from 'react';
import HomeNavbar from '../Components/navbar/Navbar';
import axios from 'axios';
import Select from 'react-select';
import { Table, Form } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const GenerateReport = () => {
    const [hodData, setHodData] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [error, setError] = useState(null);
    const [showViewCommentModal, setShowViewCommentModal] = useState(false);
    const [commentsToView, setCommentsToView] = useState([]);
    const [hasAccess, setHasAccess] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedCalStatus, setSelectedCalStatus] = useState(null);
    const [filteredPhonebookData, setFilteredPhonebookData] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const allowedRoles = [
        'HOD',
        'Team Leader',
        'Manager',
        'Coordinator',
        'superadmin',
        'CEO',
        'MD'
    ];

    const calStatusOptions = [
        { value: 'No Answer', label: 'No Answer' },
        { value: 'Not Interested', label: 'Not Interested' },
        { value: 'Convert to Lead', label: 'Convert to Lead' },
    ];

    const getHodPhoneBookData = async (token) => {
        try {
            const response = await axios.get(
                `/api/phonebook/get-all-phonebook`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setHodData(response.data);
            getAllUsers(token);
        } catch (error) {
            console.log('Error fetching HOD Phone Book data:', error);
            setError('No Phone Book Data Available.');
        }
    };

    const getAllUsers = async (token) => {
        try {
            const response = await axios.get(
                `/api/users/get-users-by-pipeline`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const users = response.data;

            const userOptions = users.map(user => ({
                value: user._id,
                label: user.name
            }));

            setAllUsers(userOptions);
        } catch (error) {
            console.log('Error fetching all users:', error);
        }
    };

    useEffect(() => {
        const phoneUserData = localStorage.getItem('phoneUserData');

        if (!phoneUserData) {
            setError('No user data found in local storage.');
            return;
        }

        const parsedUserData = JSON.parse(phoneUserData);
        const { token, role } = parsedUserData;

        if (!token) {
            setError('No token found in user data.');
            return;
        }

        if (allowedRoles.includes(role)) {
            setHasAccess(true);
            getHodPhoneBookData(token);
        } else {
            setError('You do not have access to this dashboard.');
        }
    }, []);

    useEffect(() => {
        const results = hodData.filter(entry =>
            entry.number.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (!selectedUser || entry.user._id === selectedUser.value) &&
            (!selectedCalStatus || entry.calstatus === selectedCalStatus.value) &&
            (!startDate || new Date(entry.updatedAt) >= startDate) &&
            (!endDate || new Date(entry.updatedAt) <= new Date(endDate).setHours(23, 59, 59, 999))
        );
        setFilteredPhonebookData(results);
    }, [searchQuery, hodData, selectedUser, selectedCalStatus, startDate, endDate]);

    const handleViewComments = (comments) => {
        setCommentsToView(comments);
        setShowViewCommentModal(true);
    };

    // Calculate total numbers and total based on calstatus
    const totalNumbers = filteredPhonebookData.length;
    const totalInterested = filteredPhonebookData.filter(entry => entry.calstatus === 'No Answer').length;
    const totalNotInterested = filteredPhonebookData.filter(entry => entry.calstatus === 'Not Interested').length;
    const totalConvertedLead = filteredPhonebookData.filter(entry => entry.calstatus === 'Convert to Lead').length;

    return (
        <>
            <HomeNavbar />

            <div className="phonebook-container">
                <div  style={{ display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center' }}>
                    <h5>Total Numbers ({totalNumbers})</h5>
                    <h5 style={{ color: "blue" }}>Total Interested ({totalInterested})</h5>
                    <h5 style={{ color: "red" }}>Total Not Interested ({totalNotInterested})</h5>
                    <h5 style={{ color: "green" }}>Lead Converted ({totalConvertedLead})</h5>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', alignItems: 'center' }}>
                    <Form.Group controlId="selectUser" className='w-100'>
                        <Select
                            options={allUsers}
                            value={selectedUser}
                            onChange={setSelectedUser}
                            placeholder="Select User"
                            isClearable
                        />
                    </Form.Group>

                    <Form.Group controlId="selectCalStatus" className='w-100'>
                        <Select
                            options={calStatusOptions}
                            value={selectedCalStatus}
                            onChange={setSelectedCalStatus}
                            placeholder="Select Call Status"
                            isClearable
                        />
                    </Form.Group>

                    <div className='w-100' style={{ display: 'flex', gap: '15px' }}>
                        <DatePicker
                            selected={startDate}
                            onChange={date => setStartDate(date)}
                            placeholderText="Start Date"
                            dateFormat="yyyy/MM/dd"
                            className="form-control"
                        />
                        <DatePicker
                            selected={endDate}
                            onChange={date => setEndDate(date)}
                            placeholderText="End Date"
                            dateFormat="yyyy/MM/dd"
                            className="form-control"
                        />
                    </div>
                </div>



                <div>
                    {error ? (
                        <p style={{ color: 'red' }}>{error}</p>
                    ) : hasAccess ? (
                        filteredPhonebookData.length > 0 ? (
                            <Table striped bordered hover responsive className='mt-3'>
                                <thead>
                                    <tr className='teble_tr_class'>
                                        <th className="equal-width">Number</th>
                                        <th className="equal-width">Status</th>
                                        <th className="equal-width">Call Status</th>
                                        <th className="equal-width">Pipeline</th>
                                        <th className="equal-width">User</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPhonebookData.map((entry, index) => (
                                        <tr key={index}>
                                            <td style={{ textAlign: 'center' }}>{entry.number}</td>
                                            <td style={{ textAlign: 'center' }}>{entry.status}</td>
                                            <td
                                                style={{
                                                    textAlign: 'center',
                                                    backgroundColor: entry.calstatus === 'No Answer' ? 'green' : entry.calstatus === 'Not Interested' ? 'red' : 'transparent',
                                                    color: entry.calstatus === 'No Answer' || entry.calstatus === 'Not Interested' ? 'white' : 'inherit'
                                                }}
                                            >
                                                {entry.calstatus}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{entry.pipeline.name}</td>
                                            <td style={{ textAlign: 'center' }}>{entry.user.name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : (
                            <p className='text-center mt-5'>No Data Available</p>
                        )
                    ) : (
                        <p>You do not have access to this page.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default GenerateReport;
