import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Button, Select } from 'react-bootstrap';
import '../Components/login/Login.css';
import JoveraLogoweb from '../Assets/JoveraLogoweb.png';

const RegisterUser = () => {
    const [name, setName] = useState('');
    const [pipeline, setPipeline] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [image, setImage] = useState(null);
    const [role, setRole] = useState('');
    const [branch, setBranch] = useState('');
    const [permissions, setPermissions] = useState([]);
    const [delStatus, setDelStatus] = useState(false);
    const [verified, setVerified] = useState(false);
    const [pipelines, setPipelines] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPipelinesAndBranches = async () => {
            try {
                const [pipelinesRes, branchesRes] = await Promise.all([
                    axios.get('/api/pipelines/get-pipelines'),
                    axios.get('/api/branches/get-branches')
                ]);
                setPipelines(pipelinesRes.data);
                setBranches(branchesRes.data);
            } catch (err) {
                console.error('Error fetching pipelines and branches:', err);
                setError('Failed to fetch pipelines or branches');
            }
        };

        fetchPipelinesAndBranches();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('pipeline', pipeline);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('role', role);
        formData.append('branch', branch);
        if (image) {
            formData.append('image', image); // Append image file if selected
        }
        formData.append('permissions', JSON.stringify(permissions)); // Send permissions as a JSON string
        formData.append('delStatus', delStatus);
        formData.append('verified', verified);

        try {
            const res = await axios.post('/api/users/create-user', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('User created:', res.data);
            setLoading(false);
            setName('')
            setPipeline('')
            setEmail('')
            setPassword('')
            setImage(null)
            setRole('')
            setBranch('')
            // Optionally reset form or redirect user
        } catch (err) {
            console.error('Error creating user:', err);
            setError('Failed to create user');
            setLoading(false);
        }
    };

    return (
        <div className='login_container'>
            <div className='card_main_container'>
                <Card>
                    <div className='joveralogo_image_container'>
                        <img src={JoveraLogoweb} alt="JoveraLogoweb" className='joveralogo_image' />
                    </div>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <Card.Body className="d-flex flex-column">
                        <div className="flex-grow-1">
                            <Form onSubmit={handleSubmit} encType="multipart/form-data">
                                <Form.Group>
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)} required
                                    />
                                </Form.Group>
                                <Form.Group className='mt-2'>
                                    <Form.Label>Pipeline</Form.Label>
                                    <Form.Select value={pipeline} onChange={(e) => setPipeline(e.target.value)} required>
                                        <option value="">Select Pipeline</option>
                                        {pipelines.map((pipeline) => (
                                            <option key={pipeline._id} value={pipeline._id}>
                                                {pipeline.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className='mt-2'>
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)} required
                                    />
                                </Form.Group>

                                <Form.Group className='mt-2'>
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Enter Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)} required
                                    />
                                </Form.Group>

                                <Form.Group className='mt-2'>
                                    <Form.Label>Role</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)} required
                                    />
                                </Form.Group>

                                <Form.Group className='mt-2'>
                                    <Form.Label>Branch</Form.Label>
                                    <Form.Select value={branch} onChange={(e) => setBranch(e.target.value)} required>
                                        <option value="">Select Branch</option>
                                        {branches.map((branch) => (
                                            <option key={branch._id} value={branch._id}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className='mt-3'>
                                    <Form.Label>Image</Form.Label>
                                    <input type="file" onChange={(e) => setImage(e.target.files[0])} />
                                </Form.Group>

                                {/* <div>
                                    <label>Branch:</label>
                                    <select value={branch} onChange={(e) => setBranch(e.target.value)} required>
                                        <option value="">Select Branch</option>
                                        {branches.map((branch) => (
                                            <option key={branch._id} value={branch._id}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                </div> */}

                                <Button type="submit" className='w-100 mt-4 gradient_button' disabled={loading}>
                                    {loading ? 'Registering...' : 'Register'}
                                </Button>

                                {/* <div>
                                    <button type="submit" disabled={loading}>
                                        {loading ? 'Registering...' : 'Register'}
                                    </button>
                                </div> */}
                            </Form>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};

export default RegisterUser;