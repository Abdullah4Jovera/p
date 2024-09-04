import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-bootstrap/Modal';
import { Button, Container, Table, Form, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import { AiOutlineEye } from "react-icons/ai";
import HomeNavbar from '../navbar/Navbar';
import { MdOutlineAddCircle } from 'react-icons/md';
import ImportCSVForm from '../ImportCSv'; // Fixed import
import '../../pages/style.css';
import defaultimage from '../../Assets/defaultimage.png'
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker'; // Import DatePicker
import "react-datepicker/dist/react-datepicker.css";
const RegisteredNumber = () => {
    const [pipelines, setPipelines] = useState([]);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [phonebookData, setPhonebookData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [selectedPipeline, setSelectedPipeline] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [show, setShow] = useState(false);
    const [showViewCommentModal, setShowViewCommentModal] = useState(false);
    const [commentsToView, setCommentsToView] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCalStatus, setSelectedCalStatus] = useState(null); // New state for call status filter
    const [startDate, setStartDate] = useState(null); // New state for start date
    const [endDate, setEndDate] = useState(null); // New state for end date
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const navigate = useNavigate()

    useEffect(() => {
        const userData = localStorage.getItem('phoneUserData')
        const parsedData = userData ? JSON.parse(userData) : {}

        if (parsedData.role !== 'superadmin') {
            navigate('/')
        }
    }, [navigate])

    const calStatusOptions = [
        { value: '', label: 'All Call Statuses' },
        { value: 'No Answer', label: 'No Answer' },
        { value: 'Not Interested', label: 'Not Interested' },
        { value: 'Convert to Lead', label: 'Convert to Lead' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('phoneUserData'))?.token;
                if (!token) throw new Error('Token not found');

                const [pipelinesResponse, usersResponse, phoneBookResponse] = await Promise.all([
                    axios.get(`/api/pipelines/get-pipelines`),
                    axios.get(`/api/users/get-users`),
                    axios.get(`/api/phonebook/get-all-phonebook`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                setPipelines(pipelinesResponse.data.map(pipeline => ({
                    value: pipeline._id,
                    label: pipeline.name,
                })));

                setUsers(usersResponse.data.map(user => ({
                    value: user._id,
                    label: user.name,
                    pipelines: user.pipeline || [], // Ensure pipelines is an array
                })));

                const sortedData = phoneBookResponse.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                setPhonebookData(sortedData);
                setFilteredData(sortedData);
            } catch (error) {
                setError(error.response?.data?.message || error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (selectedPipeline) {
            const pipelineUsers = users.filter(user =>
                Array.isArray(user.pipelines) && user.pipelines.some(pipeline => pipeline._id === selectedPipeline.value)
            );
            setFilteredUsers(pipelineUsers);
        } else {
            setFilteredUsers(users);
        }
    }, [selectedPipeline, users]);

    useEffect(() => {
        let filtered = phonebookData;

        if (selectedPipeline) {
            filtered = filtered.filter(entry =>
                entry.pipeline && entry.pipeline._id === selectedPipeline.value
            );
        }

        if (selectedUser) {
            filtered = filtered.filter(entry =>
                entry.user && entry.user._id === selectedUser.value
            );
        }

        if (selectedCalStatus && selectedCalStatus.value) {
            filtered = filtered.filter(entry =>
                entry.calstatus === selectedCalStatus.value
            );
        }

        if (searchQuery) {
            filtered = filtered.filter(entry =>
                entry.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (entry.status && entry.status.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (entry.calstatus && entry.calstatus.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        if (startDate && endDate) {
            filtered = filtered.filter(entry => {
                const entryDate = new Date(entry.updatedAt);
                return entryDate >= startDate && entryDate <= endDate;
            });
        }

        setFilteredData(filtered);
    }, [selectedPipeline, selectedUser, selectedCalStatus, searchQuery, phonebookData, startDate, endDate]);

    if (loading) return (
        <div className="no-results" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
            </Spinner>
        </div>
    );
    if (error) return <p>Error: {error}</p>;

    const handleViewCommentsClick = (entry) => {
        setCommentsToView(entry.comments || []);
        setShowViewCommentModal(true);
    };

    const handleCSVUpload = async (formData) => {
        try {
            const response = await axios.post(`/api/phonebook/upload-csv-for-superadmin`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(response.data.message);
            handleClose();
        } catch (error) {
            console.error('Error uploading CSV:', error);
            alert('Error uploading CSV file.');
        }
    };

    return (
        <>
            <HomeNavbar />
            <Container fluid>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'end', justifyContent:'end' }} className='mt-4' >

                        <Button className='button_one' onClick={handleShow}>
                            <MdOutlineAddCircle style={{ marginTop: '-2px' }} /> Import CSV
                        </Button>

                        <Button className='create_account' onClick={() => navigate('/createuser')} >Create Account</Button>
                        <Button className='button_two' onClick={() => navigate('/generatereport')} >Call History</Button>
                        <Button className='cancel_btn' onClick={() => navigate('/allusers')} >All Users</Button>
                    </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '10px' }} className='mt-4'>
                    {/* Filter by pipeline */}
                    <div className="filter-container w-100">
                        <label htmlFor="pipeline-filter">Filter by Pipeline:</label>
                        <Select
                            id="pipeline-filter"
                            options={[{ value: '', label: 'All Pipelines' }, ...pipelines]}
                            value={selectedPipeline}
                            onChange={setSelectedPipeline}
                            isClearable
                        />
                    </div>

                    {/* Filter by user */}
                    <div className="filter-container w-100">
                        <label htmlFor="user-filter">Filter by User:</label>
                        <Select
                            id="user-filter"
                            options={[{ value: '', label: 'All Users' }, ...filteredUsers]}
                            value={selectedUser}
                            onChange={setSelectedUser}
                            isClearable
                            isDisabled={!selectedPipeline}
                        />
                    </div>

                    {/* Filter by Call Status */}
                    <div className="filter-container w-100">
                        <label htmlFor="callstatus-filter">Filter by Call Status:</label>
                        <Select
                            id="callstatus-filter"
                            options={calStatusOptions}
                            value={selectedCalStatus}
                            onChange={setSelectedCalStatus}
                            isClearable
                        />
                    </div>

                    {/* Search by Number */}
                    <Form.Group controlId="search" className='w-100'>
                        <Form.Label className='mb-0'>Search by Number</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Search by Number"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </Form.Group>

                    <div className="filter-container w-100">
                        <label htmlFor="date-filter">Filter by Date</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                selectsStart
                                startDate={startDate}
                                endDate={endDate}
                                placeholderText="Start Date"
                                dateFormat="yyyy/MM/dd"
                                className="form-control"
                            />
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                selectsEnd
                                startDate={startDate}
                                endDate={endDate}
                                minDate={startDate}
                                placeholderText="End Date"
                                dateFormat="yyyy/MM/dd"
                                className="form-control"
                            />
                        </div>
                    </div>

                </div>



                <Table hover bordered responsive className='mt-3 table_main_container' size='md'>
                    <thead style={{ backgroundColor: '#f8f9fd' }}>
                        <tr
                            style={{
                                backgroundColor: '#e9ecef', // Light background color for the row
                                color: '#343a40', // Dark text color
                                borderBottom: '2px solid #dee2e6', // Bottom border for rows
                                transition: 'background-color 0.3s ease', // Smooth transition for hover effect
                            }}
                        >
                            <th style={{ backgroundColor: '#f8f9fd' }} className="equal-width">Number</th>
                            <th style={{ backgroundColor: '#f8f9fd' }} className="equal-width">Status</th>
                            <th style={{ backgroundColor: '#f8f9fd' }} className="equal-width">Call Status</th>
                            <th style={{ backgroundColor: '#f8f9fd' }} className="equal-width">Pipeline</th>
                            <th style={{ backgroundColor: '#f8f9fd' }} className="equal-width">User</th>
                            <th style={{ backgroundColor: '#f8f9fd' }} className="equal-width">View Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map((entry) => (
                                <tr key={entry._id}>
                                    <td className='table_td_class'>
                                        <a href={`tel:${entry.number}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            {entry.number}
                                        </a>
                                    </td>
                                    <td className='table_td_class'>{entry.status}</td>
                                    <td
                                        style={{
                                            textAlign: 'center',
                                            backgroundColor: entry.calstatus === 'No Answer' ? 'green' : entry.calstatus === 'Not Interested' ? 'red' : 'transparent',
                                            color: entry.calstatus === 'No Answer' || entry.calstatus === 'Not Interested' ? 'white' : 'inherit'
                                        }}
                                        className='table_td_class'
                                    >
                                        {entry.calstatus}
                                    </td>
                                    <td className='table_td_class'>{entry.pipeline?.name || 'N/A'}</td>
                                    <td className='table_td_class'>{entry.user?.name || 'N/A'}</td>
                                    <td style={{ textAlign: 'center' }}>

                                        <div className='viewAction'>
                                            <AiOutlineEye onClick={() => handleViewCommentsClick(entry)}
                                                style={{ fontSize: '15px', cursor: 'pointer', color: 'white' }}

                                            />
                                            <div className="tooltip">View Comments</div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center' }}>No data found</td>
                            </tr>
                        )}
                    </tbody>
                </Table>

                {/* View Comments Modal */}
                <Modal show={showViewCommentModal} onHide={() => setShowViewCommentModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>View Comments</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ height: 'auto', maxHeight: '700px', overflowY: 'scroll' }}>
                        <ul>
                            {commentsToView.length > 0 ? (
                                commentsToView.map((comment, index) => (
                                    <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', padding: '10px 0', }} >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} >
                                            <img
                                                src={comment.user?.image || defaultimage}
                                                alt="User image"
                                                className='image_url_default'
                                                onError={(e) => {
                                                    e.target.onerror = null; // Prevents infinite loop in case defaultimage also fails
                                                    e.target.src = defaultimage; // Fallback to default image
                                                }}
                                            />

                                            <div>
                                                <p className='mb-0'>{comment?.remarks && comment?.remarks ? comment?.remarks : 'No Comments Available'}</p>
                                                <small> {comment.user?.name && comment.user?.name ? comment.user.name : 'Unknown User'} </small>
                                            </div>
                                        </div>

                                        <small>
                                            {`${new Date(comment.createdAt).toDateString()} - ${new Date(comment.createdAt).toLocaleTimeString()}`}
                                        </small>

                                    </li>
                                ))
                            ) : (
                                <p>No Comments Available.</p>
                            )}
                        </ul>
                    </Modal.Body>
                    {/* <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowViewCommentModal(false)}>
                            Close
                        </Button>
                    </Modal.Footer> */}
                </Modal>

                {/* Import CSV Modal */}
                <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} centered size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Import CSV</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <ImportCSVForm users={users} pipelines={pipelines} onSubmit={handleCSVUpload} />
                    </Modal.Body>
                </Modal>
            </Container>
        </>
    );
};

export default RegisteredNumber;