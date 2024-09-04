import React, { useState, useEffect } from 'react';
import HomeNavbar from '../Components/navbar/Navbar';
import axios from 'axios';
import { AiOutlineEye } from "react-icons/ai";
import { Table, Modal, Button, Form, Dropdown, Card } from 'react-bootstrap';
import Select from 'react-select';
import { MdAdd } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { FiEdit2 } from "react-icons/fi";
import defaultimage from '../Assets/defaultimage.png'
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const HodPhoneBook = () => {
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
    const [showAddCommentModal, setShowAddCommentModal] = useState(false);
    const [currentComment, setCurrentComment] = useState('');
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [dropdownEntry, setDropdownEntry] = useState(null);
    const [pendingStatusChange, setPendingStatusChange] = useState(null);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [csvFile, setCsvFile] = useState(null);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const navigate = useNavigate();

    const allowedRoles = [
        'HOD',
        'Team Leader',
        'Manager',
        'Coordinator'
    ];

    const calStatusOptions = [
        { value: 'No Answer', label: 'No Answer' },
        { value: 'Not Interested', label: 'Not Interested' },
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
            const filteredData = response.data.filter(entry => entry.calstatus !== 'Convert to Lead');
            const sortedData = filteredData.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            setHodData(sortedData);
            setFilteredPhonebookData(sortedData);
            getAllUsers(token);

            console.log(response.data, 'responseresponse')
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
        const { token, role, _id, pipeline } = parsedUserData;

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
            (!endDate || new Date(entry.updatedAt) <= endDate)
        );
        setFilteredPhonebookData(results);
    }, [searchQuery, hodData, selectedUser, selectedCalStatus, startDate, endDate]);

    const handleViewComments = (comments) => {
        setCommentsToView(comments);
        setShowViewCommentModal(true);
    };

    const handleViewCommentsClick = (entry) => {
        handleViewComments(entry.comments);
    };

    const clearSelectedUser = () => {
        setSelectedUser(null);
    };

    // Add Comment API
    const handleSaveComment = async () => {
        if (selectedEntry && currentComment.trim()) {
            try {
                const userData = JSON.parse(localStorage.getItem('phoneUserData'));
                if (userData && userData.token) {
                    await axios.post(
                        `/api/phonebook/add-comment`,
                        {
                            phonebookId: selectedEntry._id,
                            comment: currentComment
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${userData.token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    // Update local state
                    const updatedData = hodData.map(entry =>
                        entry._id === selectedEntry._id
                            ? { ...entry, comments: [...(entry.comments || []), { remarks: currentComment, createdAt: new Date() }] }
                            : entry
                    );

                    const sortedUpdatedData = updatedData.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    setHodData(sortedUpdatedData);
                    setFilteredPhonebookData(sortedUpdatedData);
                } else {
                    navigate('/');
                }
            } catch (error) {
                console.error('Error saving comment:', error);
            }
        }
        setCurrentComment('');
        setSelectedEntry(null);
        setShowAddCommentModal(false);
    };

    const handleAddCommentClick = (entry) => {
        setSelectedEntry(entry);
        setCurrentComment('');
        setShowAddCommentModal(true);
    };

    const updateCallStatus = async (status) => {
        if (dropdownEntry) {
            try {
                const userData = JSON.parse(localStorage.getItem('phoneUserData'));
                if (userData && userData.token) {
                    await axios.put(
                        `/api/phonebook/update-calstatus/${dropdownEntry._id}`,
                        {
                            calstatus: status
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${userData.token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    const updatedData = hodData.map((entry) =>
                        entry._id === dropdownEntry._id ? { ...entry, calstatus: status } : entry
                    );
                    // Re-sort updated data by updatedAt
                    const sortedUpdatedData = updatedData.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    setHodData(sortedUpdatedData);
                    setFilteredPhonebookData(sortedUpdatedData);
                } else {
                    navigate('/');
                }
            } catch (error) {
                console.error('Error updating call status:', error);
            }
        }

        setDropdownEntry(null); // Hide dropdown after selecting status
        setShowConvertModal(false); // Hide confirmation modal after updating
    };

    const handleCallStatusChange = (status) => {
        if (status === 'Convert to Lead') {
            setPendingStatusChange(status);
            setShowConvertModal(true);
        } else {
            updateCallStatus(status);
        }
    };

    const handleConfirmConversion = () => {
        updateCallStatus(pendingStatusChange);
    };
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
            if (fileExtension !== 'csv') {
                setError('Only CSV files are Allowed.');
                setCsvFile(null); // Clear the file input
            } else {
                setError('');
                setCsvFile(selectedFile);
            }
        }
    };

    const handleImportSubmit = async () => {
        if (selectedUsers.length > 0 && csvFile && selectedAgent) {
            const userData = JSON.parse(localStorage.getItem('phoneUserData'));
            if (userData && userData.token) {
                const { pipeline, _id: userId } = userData;

                const formData = new FormData();
                // Add userData._id to `visibilityUserIds`
                formData.append('visibilityUserIds[]', userId);
                // Append each selected user ID to `visibilityUserIds`
                selectedUsers.forEach(user => {
                    formData.append('visibilityUserIds[]', user.value);
                });
                formData.append('pipelineId', pipeline);
                formData.append('userId', selectedAgent.value); // Use selectedAgent's ID
                formData.append('file', csvFile);

                try {
                    await axios.post('/api/phonebook/upload-csv', formData, {
                        headers: {
                            Authorization: `Bearer ${userData.token}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                    setShowImportModal(false);
                } catch (error) {
                    console.error('Error uploading CSV:', error);
                }
            } else {
                navigate('/');
            }
        }
    };


    return (
        <>
            <HomeNavbar />
            <div className="phonebook-container">

                <div style={{ display: 'flex', justifyContent: 'end', gap: '15px', alignItems: 'end', marginBottom: '20px', marginTop: '-10px' }}>
                    <Button className='button_one' onClick={() => setShowImportModal(true)}>Import CSV</Button>
                    <Button className='button_two' onClick={() => navigate('/generatereport')} >Call History</Button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', alignItems: 'center' }}>
                    <Form.Group controlId="searchBarNumber" className='w-100'>
                        <Form.Control
                            type="text"
                            placeholder="Search by Number"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='searchfield'
                        />
                    </Form.Group>

                    <Form.Group controlId="selectUser" className='w-100'>
                        <Select
                            options={allUsers}
                            value={selectedUser}
                            onChange={setSelectedUser}
                            placeholder="Select User"
                            isClearable
                            className='searchfield'
                        />
                    </Form.Group>

                    <Form.Group controlId="selectCalStatus" className='w-100'>
                        <Select
                            options={calStatusOptions}
                            value={selectedCalStatus}
                            onChange={setSelectedCalStatus}
                            placeholder="Select Call Status"
                            isClearable
                            className='searchfield'
                        />
                    </Form.Group>

                    <div className='w-100' style={{ display: 'flex', gap: '15px' }} >
                        <DatePicker
                            selected={startDate}
                            onChange={date => setStartDate(date)}
                            placeholderText="Start Date"
                            dateFormat="yyyy/MM/dd"
                            className="form-control searchfield"
                        />
                        <DatePicker
                            selected={endDate}
                            onChange={date => setEndDate(date)}
                            placeholderText="End Date"
                            dateFormat="yyyy/MM/dd"
                            className="form-control searchfield"
                        />
                    </div>
                </div>


                <div>
                    {error ? (
                        <p style={{ color: 'red' }}>{error}</p>
                    ) : hasAccess ? (
                        filteredPhonebookData.length > 0 ? (

                            <Table hover bordered responsive className='mt-3 table_main_container' size='md' >
                                <thead style={{ backgroundColor: '#f8f9fd' }}>
                                    <tr className="teble_tr_class"
                                        style={{
                                            backgroundColor: '#e9ecef', // Light background color for the row
                                            color: '#343a40', // Dark text color
                                            borderBottom: '2px solid #dee2e6', // Bottom border for rows
                                            transition: 'background-color 0.3s ease', // Smooth transition for hover effect
                                        }}
                                    >
                                        <th className="equal-width" style={{ backgroundColor: '#f8f9fd' }}>User</th>
                                        <th className="equal-width" style={{ backgroundColor: '#f8f9fd' }}>Pipeline</th>
                                        <th className="equal-width" style={{ backgroundColor: '#f8f9fd' }}>Phone</th>
                                        <th className="equal-width" style={{ backgroundColor: '#f8f9fd' }}>Call Status</th>
                                        <th className="equal-width" style={{ backgroundColor: '#f8f9fd' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPhonebookData.map((entry, index) => (
                                        <tr key={index}>
                                            <td
                                                className='table_td_class'
                                            >{entry.user.name}</td>
                                            <td
                                                className='table_td_class'
                                            >{entry.pipeline.name}</td>
                                            <td
                                                className='table_td_class'
                                            >{entry.number}</td>
                                            <td
                                                className='table_td_class'
                                            >
                                                {entry.calstatus}
                                            </td>
                                            <td style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
                                                {dropdownEntry && dropdownEntry._id === entry._id ? (
                                                    <Dropdown>
                                                        <Dropdown.Toggle className="dropdown_menu" id="dropdown-basic">
                                                            {entry.calstatus || 'Select Status'}
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu>
                                                            <Dropdown.Item onClick={() => handleCallStatusChange('Req to call')}>Req to call</Dropdown.Item>
                                                            <Dropdown.Item onClick={() => handleCallStatusChange('No Answer')}>No Answer</Dropdown.Item>
                                                            <Dropdown.Item onClick={() => handleCallStatusChange('Not Interested')}>Not Interested</Dropdown.Item>
                                                            <Dropdown.Item onClick={() => handleCallStatusChange('Convert to Lead')}>Convert to Lead</Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                ) : (

                                                    <div className='editAction'>
                                                        <FiEdit2
                                                            onClick={() => setDropdownEntry(entry)}
                                                            style={{ fontSize: '12px', cursor: 'pointer', color: 'white' }}
                                                        />
                                                        <div className="tooltip">Edit Status</div>
                                                    </div>
                                                )}

                                                <div className='addAction'>
                                                    <MdAdd
                                                        onClick={() => handleAddCommentClick(entry)}
                                                        style={{ fontSize: '15px', cursor: 'pointer', color: 'white' }}
                                                    />
                                                    <div className="tooltip">Add Comments</div>
                                                </div>

                                                <div className='viewAction'>
                                                    <AiOutlineEye onClick={() => handleViewCommentsClick(entry)} style={{ fontSize: '15px', cursor: 'pointer', color: 'white' }} />
                                                    <div className="tooltip">View Comments</div>
                                                </div>
                                            </td>
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

                {/* View Comments Modal */}
                <Modal show={showViewCommentModal} onHide={() => setShowViewCommentModal(false)} size='lg' >
                    <Modal.Header closeButton>
                        <Modal.Title>View Comments</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ height: 'auto', maxHeight: '700px', overflowY: 'scroll' }} >
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
                                                <small> {comment.user?.name && comment.user?.name} </small>
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

                {/* Add Comment Modal */}
                <Modal show={showAddCommentModal} onHide={() => setShowAddCommentModal(false)} centered size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Add Comment</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group controlId="commentTextarea">
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={currentComment}
                                onChange={(e) => setCurrentComment(e.target.value)}
                                placeholder="Enter your comment here"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        {/* <Button variant="secondary" onClick={() => setShowAddCommentModal(false)}>
                            Close
                        </Button> */}
                        <Button className='button_one' onClick={handleSaveComment}>
                            Save Comment
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Convert to Lead Confirmation Modal */}
                <Modal show={showConvertModal} onHide={() => setShowConvertModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Confirm Conversion</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>Are you sure you want to convert this status to Lead?</Modal.Body>
                    <Modal.Footer>
                        {/* <Button variant="secondary" onClick={() => setShowConvertModal(false)}>
                            Cancel
                        </Button> */}
                        <Button className='button_one' onClick={handleConfirmConversion}>
                            Confirm
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* <Modal show={showImportModal} onHide={() => setShowImportModal(false)} style={{ borderRadius:'20px' }} >
                    <Modal.Header closeButton>
                        <Modal.Title>Import CSV</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group controlId="selectAgent" className='w-100'>
                                <Form.Label>Select Agent</Form.Label>
                                <Select
                                    options={allUsers}  // Assuming allUsers is a list of user objects with `value` and `label`
                                    value={selectedAgent}
                                    onChange={setSelectedAgent}
                                    placeholder="Select an Agent"
                                    isClearable
                                />
                            </Form.Group>

                            <Form.Group controlId="selectUser" className='w-100'>
                                <Form.Label>Select Team Leader / Coordinator </Form.Label>
                                <Select
                                    options={allUsers}
                                    value={selectedUsers}
                                    onChange={setSelectedUsers}
                                    placeholder="Select Users"
                                    isMulti
                                    isClearable
                                />
                            </Form.Group>

                            <Form.Group controlId="csvFile">
                                <Form.Label>Upload CSV</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                />
                                {error && <Form.Text className="text-danger">{error}</Form.Text>}
                            </Form.Group>

                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className='cancel_btn' onClick={() => setShowImportModal(false)}>
                            Cancel
                        </Button>
                        <Button className='button_one'  onClick={handleImportSubmit}>
                            Upload
                        </Button>
                    </Modal.Footer>
                </Modal> */}

                <Modal
                    size="lg"
                    aria-labelledby="contained-modal-title-vcenter"
                    centered
                    show={showImportModal} onHide={() => setShowImportModal(false)} style={{ borderRadius: '20px' }}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Import CSV</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group controlId="selectAgent" className='w-100'>
                                <Form.Label>Select Agent</Form.Label>
                                <Select
                                    options={allUsers}  // Assuming allUsers is a list of user objects with `value` and `label`
                                    value={selectedAgent}
                                    onChange={setSelectedAgent}
                                    placeholder="Select an Agent"
                                    isClearable
                                />
                            </Form.Group>

                            <Form.Group controlId="selectUser" className='w-100'>
                                <Form.Label>Select Team Leader / Coordinator </Form.Label>
                                <Select
                                    options={allUsers}
                                    value={selectedUsers}
                                    onChange={setSelectedUsers}
                                    placeholder="Select Users"
                                    isMulti
                                    isClearable
                                />
                            </Form.Group>

                            <Form.Group controlId="csvFile">
                                <Form.Label>Upload CSV</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                />
                                {error && <Form.Text className="text-danger">{error}</Form.Text>}
                            </Form.Group>

                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        {/* <Button className='cancel_btn' onClick={() => setShowImportModal(false)}>
                            Cancel
                        </Button> */}
                        <Button className='button_one' onClick={handleImportSubmit}>
                            Upload
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </>
    );
};

export default HodPhoneBook;
