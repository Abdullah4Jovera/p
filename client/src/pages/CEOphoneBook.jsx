import React, { useState, useEffect } from 'react';
import HomeNavbar from '../Components/navbar/Navbar';
import axios from 'axios';
import Select from 'react-select';
import { Table, Modal, Button, Container, Form, Spinner, Dropdown } from 'react-bootstrap';
import { GrView } from 'react-icons/gr';
import { MdAdd } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { FiEdit2 } from "react-icons/fi";
import defaultimage from '../Assets/defaultimage.png'
import DatePicker from 'react-datepicker'; // Import DatePicker
import "react-datepicker/dist/react-datepicker.css";

const CEOphoneBook = () => {
  const [ceoPhoneBookData, setCeoPhoneBookData] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCalStatus, setSelectedCalStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showViewCommentModal, setShowViewCommentModal] = useState(false);
  const [commentsToView, setCommentsToView] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [currentComment, setCurrentComment] = useState('');
  const [filteredPhonebookData, setFilteredPhonebookData] = useState([]);
  const [showAddCommentModal, setShowAddCommentModal] = useState(false);
  const [dropdownEntry, setDropdownEntry] = useState(null);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [startDate, setStartDate] = useState(null); // New state for start date
  const [endDate, setEndDate] = useState(null); // New state for end date
  const navigate = useNavigate();

  const calStatusOptions = [
    { value: 'No Answer', label: 'No Answer' },
    { value: 'Not Interested', label: 'Not Interested' },
    { value: 'Convert to Lead', label: 'Convert to Lead' },
  ];

  const fetchData = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('phoneUserData'))?.token;
      if (!token) {
        throw new Error('Token not found');
      }

      const [pipelinesResponse, usersResponse, phoneBookResponse] = await Promise.all([
        axios.get(`/api/pipelines/get-pipelines`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        axios.get(`/api/users/get-users`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        axios.get(`/api/phonebook/get-all-phonebook`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      setPipelines((pipelinesResponse.data || []).map(pipeline => ({
        value: pipeline._id,
        label: pipeline.name,
      })));

      setUsers((usersResponse.data || []).map(user => ({
        ...user,
        pipelines: (user.pipeline || []).map(p => p._id), // Flatten pipelines to IDs
      })));

      const sortedData = (phoneBookResponse.data || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setCeoPhoneBookData(sortedData);
      setFilteredData(sortedData);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPipeline) {
      const pipelineUsers = (users || []).filter(user => user.pipelines.includes(selectedPipeline.value));
      setFilteredUsers(pipelineUsers);
    } else {
      setFilteredUsers(users);
    }
  }, [selectedPipeline, users]);

  useEffect(() => {
    let filtered = ceoPhoneBookData;

    if (selectedPipeline) {
      filtered = filtered.filter(entry => entry.pipeline._id === selectedPipeline.value);
    }

    if (selectedUser) {
      filtered = filtered.filter(entry => entry.user?._id === selectedUser.value); // Assuming entry.user is an object
    }

    if (selectedCalStatus) {
      filtered = filtered.filter(entry => entry.calstatus === selectedCalStatus.value);
    }

    if (searchQuery) {
      filtered = filtered.filter(entry => entry.number.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (startDate && endDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.updatedAt);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }


    setFilteredData(filtered);
  }, [selectedPipeline, selectedUser, selectedCalStatus, searchQuery, ceoPhoneBookData, startDate, endDate]);

  if (loading) return (
    <div className="no-results mt-5" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
  if (error) return <p>Error: {error}</p>;

  const handleViewCommentsClick = (entry) => {
    handleViewComments(entry.comments);
  };

  const handleViewComments = (comments) => {
    setCommentsToView(comments || []); // Ensure comments is not null
    setShowViewCommentModal(true);
  };

  // Filtered call status options to include only 'No Answer' and 'Not Interested'
  const callStatusOptions = [...new Set(ceoPhoneBookData.map(entry => entry.calstatus))]
    .filter(status => status === 'No Answer' || status === 'Not Interested')
    .map(status => ({ value: status, label: status }));

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
          const updatedData = ceoPhoneBookData.map(entry =>
            entry._id === selectedEntry._id
              ? { ...entry, comments: [...(entry.comments || []), { remarks: currentComment, createdAt: new Date() }] }
              : entry
          );

          const sortedUpdatedData = updatedData.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          setCeoPhoneBookData(sortedUpdatedData);
          setFilteredPhonebookData(sortedUpdatedData);
          fetchData()
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

          const updatedData = ceoPhoneBookData.map((entry) =>
            entry._id === dropdownEntry._id ? { ...entry, calstatus: status } : entry
          );
          // Re-sort updated data by updatedAt
          const sortedUpdatedData = updatedData.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          setCeoPhoneBookData(sortedUpdatedData);
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

  return (
    <>
      <HomeNavbar />
      <Container fluid>

        <div className='mt-4' style={{ display: 'flex', justifyContent: 'end', alignItems: 'end' }} >
          <Button className='button_two' onClick={() => navigate('/generatereport')} >Call History</Button>
        </div>
        {/* Filter by pipeline */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '10px' }} className='mt-4'>
          <div className="filter-container w-100">
            <label htmlFor="pipeline-filter">Filter by Pipeline</label>
            <Select
              id="pipeline-filter"
              value={selectedPipeline}
              onChange={setSelectedPipeline}
              options={[{ value: '', label: 'All Pipelines' }, ...pipelines]}
              isClearable
            />
          </div>

          {/* Filter by user */}
          <div className="filter-container w-100">
            <label htmlFor="user-filter">Filter by User</label>
            <Select
              id="user-filter"
              value={selectedUser}
              onChange={setSelectedUser}
              options={[{ value: '', label: 'Select User' }, ...filteredUsers.map(user => ({ value: user._id, label: user.name }))]}
              isClearable
            />
          </div>

          {/* Filter by call status */}
          <div className="filter-container w-100">
            <label htmlFor="user-filter">Filter by Call Status</label>
            <Form.Group controlId="selectCalStatus" className='w-100'>
              <Select
                options={calStatusOptions}
                value={selectedCalStatus}
                onChange={setSelectedCalStatus}
                placeholder="Select Call Status"
                isClearable
              />
            </Form.Group>
          </div>
          {/* Search by Number */}
          <Form.Group controlId="searchBarNumber" className='w-100'>
            <label htmlFor="search-query">Search by Number:</label>
            <Form.Control
              type="text"
              placeholder="Search by Number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Form.Group>
          <div className="filter-container w-100">
            <label htmlFor="date-filter">Filter by  Date</label>
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
              className="teble_tr_class"
              style={{
                backgroundColor: '#e9ecef', // Light background color for the row
                color: '#343a40', // Dark text color
                borderBottom: '2px solid #dee2e6', // Bottom border for rows
                transition: 'background-color 0.3s ease', // Smooth transition for hover effect
              }}
            >
              <th style={{ backgroundColor: '#f8f9fd' }} className="equal-width">User</th>
              <th style={{ backgroundColor: '#f8f9fd' }} className="equal-width">Pipeline</th>
              <th style={{ backgroundColor: '#f8f9fd' }} className="equal-width">Number</th>
              <th style={{ backgroundColor: '#f8f9fd' }} className="equal-width">Status</th>
              <th style={{ backgroundColor: '#f8f9fd' }} className="equal-width">Call Status</th>
              <th style={{ backgroundColor: '#f8f9fd' }} className="equal-width">Actions</th>
              {/* <th className="equal-width">Add Comment</th>
              <th className="equal-width">View Comments</th> */}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((entry, index) => (
                <tr key={index}>
                  <td style={{ textAlign: 'center' }} className='table_td_class'>
                    {entry.user?.name || 'N/A'}
                  </td>
                  <td className='table_td_class' style={{ textAlign: 'center' }}>{entry.pipeline?.name || 'N/A'}</td>
                  <td className='table_td_class' style={{ textAlign: 'center' }}>{entry.number}</td>
                  <td className='table_td_class' style={{ textAlign: 'center' }}>{entry.status}</td>
                  <td
                    style={{
                      textAlign: 'center',
                      backgroundColor: entry.calstatus === 'No Answer' ? 'green' : entry.calstatus === 'Not Interested' ? 'red' : 'transparent',
                      color: entry.calstatus === 'No Answer' || entry.calstatus === 'Not Interested' ? 'white' : 'inherit',

                    }}
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
                      <MdAdd onClick={() => handleAddCommentClick(entry)} style={{ fontSize: '15px', cursor: 'pointer', color: 'white' }} />
                      <div className="tooltip">Add Comments</div>
                    </div>

                    <div className='viewAction'>
                      <GrView
                        style={{ fontSize: '15px', cursor: 'pointer', color: 'white' }}
                        onClick={() => handleViewCommentsClick(entry)}
                      />
                      <div className="tooltip">View Comments</div>
                    </div>
                  </td>

                  {/* <td style={{ textAlign: 'center' }}>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                  </td> */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>No data available</td>
              </tr>
            )}
          </tbody>
        </Table>

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
            <Button variant="secondary" onClick={() => setShowViewCommentModal(false)}>Close</Button>
          </Modal.Footer> */}
        </Modal>

        {/* Convert to Lead Confirmation Modal */}
        <Modal show={showConvertModal} onHide={() => setShowConvertModal(false)} centered >
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
      </Container>
    </>
  );
};

export default CEOphoneBook;
