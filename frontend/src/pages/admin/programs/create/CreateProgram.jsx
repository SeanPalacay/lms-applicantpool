// src/components/admin/programs/CreateProgram.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import adminService from '../../../../services/adminService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import '../styles/CreateProgram.css'; // Create this CSS file

const CreateProgram = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'active',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            await adminService.createProgram(formData);
            alert('Program created successfully!');
            navigate('/admin/programs');
        } catch (err) {
            setError('Failed to create program: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <AlertBanner message={error} type="error" />;

    return (
        <div className="create-program">
            <div className="section-header">
                <h2><BookOpen size={24} className="icon-inline" /> Create New Program</h2>
            </div>
            <form onSubmit={handleSubmit} className="program-form">
                <div className="form-group">
                    <label htmlFor="title">Program Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <div className="form-actions">
                    <button type="submit" className="action-button primary">
                        Create Program
                    </button>
                    <button
                        type="button"
                        className="action-button secondary"
                        onClick={() => navigate('/admin/programs')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateProgram;