import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import Select from 'react-select';

const ImportCSVForm = ({ pipelines, users, onSubmit }) => {
    console.log(pipelines,users,'pipelinesData')
    const [selectedPipeline, setSelectedPipeline] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [visibilityUser, setVisibilityUser] = useState(null); // State for visibility user
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Handle file selection with validation for CSV files
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

        if (fileExtension !== 'csv') {
            setError('Only CSV files are allowed.');
            setFile(null);
        } else {
            setError('');
            setFile(selectedFile);
        }
    };

    // Filter users when the pipeline is selected
    useEffect(() => {
        if (selectedPipeline) {
            const pipelineUsers = users.filter(user =>
                user.pipelines.some(pipeline => pipeline._id === selectedPipeline.value)
            );
            setFilteredUsers(pipelineUsers);
            // Reset selected user and visibility user when pipeline changes
            setSelectedUser(null);
            setVisibilityUser(null);
        } else {
            setFilteredUsers(users);
        }
    }, [selectedPipeline, users]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPipeline || !selectedUser || !file || !visibilityUser) {
            setMessage('Please select a pipeline, a user, a visibility user, and upload a CSV file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('pipelineId', selectedPipeline.value);
        formData.append('userId', selectedUser.value); // Pass single user ID
        formData.append('visibilityUserId', visibilityUser.value); // Pass visibility user ID

        setLoading(true);
        try {
            await onSubmit(formData);
            setMessage('File uploaded successfully.');
        } catch (error) {
            console.error('Error uploading CSV:', error);
            setMessage('Error uploading CSV file.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="pipelineSelect" className="mb-1">Select Pipeline:</label>
                <Select
                    id="pipelineSelect"
                    options={pipelines}
                    value={selectedPipeline}
                    onChange={setSelectedPipeline}
                    className="selectOptionModal"
                />
            </div>

            <div>
                <label htmlFor="modalUser" className="mb-1">Select User </label>
                <Select
                    id="modalUser"
                    options={filteredUsers.map(user => ({
                        value: user.value,
                        label: user.label,
                    }))}
                    value={selectedUser}
                    onChange={setSelectedUser}
                    className="selectOptionModal"
                    isDisabled={!selectedPipeline}
                />
            </div>

            <div>
                <label htmlFor="visibilityUserSelect" className="mb-1">Select Team Leader Or Coordinator </label>
                <Select
                    id="visibilityUserSelect"
                    options={filteredUsers.map(user => ({
                        value: user.value,
                        label: user.label,
                    }))}
                    value={visibilityUser}
                    onChange={setVisibilityUser}
                    className="selectOptionModal"
                    isDisabled={!selectedPipeline}
                />
            </div>

            <div>
                <label htmlFor="modalFile" className="mt-3">Upload CSV</label>
                <input
                    type="file"
                    id="modalFile"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="inputFileUpload"
                />
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
            <Button variant="secondary" type="submit" disabled={loading || !!error} className="w-100 mt-3 button_one">
                {loading ? 'Uploading...' : 'Upload'}
            </Button>
            {message && <p style={{ color: 'red' }}>{message}</p>}
        </form>
    );
};

export default ImportCSVForm;