import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import adminService from '../../../../services/adminService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';

const CreateQuiz = () => {
    const [formData, setFormData] = useState({
        title: '',
        program_id: '',
        questions: [{ question_text: '', options: ['', '', '', ''], correct_answer: '' }],
    });
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const data = await adminService.getProgramList();
                setPrograms(data);
            } catch (err) {
                setError('Failed to fetch programs: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPrograms();
    }, []);

    const handleChange = (e, questionIndex, optionIndex) => {
        const { name, value } = e.target;
        if (name === 'question_text' || name === 'correct_answer') {
            const updatedQuestions = [...formData.questions];
            updatedQuestions[questionIndex][name] = value;
            setFormData({ ...formData, questions: updatedQuestions });
        } else if (name === 'option') {
            const updatedQuestions = [...formData.questions];
            updatedQuestions[questionIndex].options[optionIndex] = value;
            setFormData({ ...formData, questions: updatedQuestions });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const addQuestion = () => {
        setFormData({
            ...formData,
            questions: [...formData.questions, { question_text: '', options: ['', '', '', ''], correct_answer: '' }],
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            await adminService.createQuiz(formData);
            alert('Quiz created successfully!');
            navigate('/admin/programs');
        } catch (err) {
            setError('Failed to create quiz: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <AlertBanner message={error} type="error" />;

    return (
        <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HelpCircle size={24} />
                    Create New Quiz
                </h2>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>Quiz Title</label>
                    <input
                        type="text"
                        style={{ 
                            padding: '8px 16px', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '8px', 
                            fontSize: '14px', 
                            color: '#1e293b', 
                            backgroundColor: 'white' 
                        }}
                        value={formData.title}
                        onChange={(e) => handleChange(e)}
                        name="title"
                        required
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>Program</label>
                    <select
                        style={{ 
                            padding: '8px 16px', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '8px', 
                            fontSize: '14px', 
                            color: '#1e293b', 
                            backgroundColor: 'white' 
                        }}
                        value={formData.program_id}
                        onChange={(e) => handleChange(e)}
                        name="program_id"
                        required
                    >
                        <option value="">Select a program</option>
                        {programs.map((program) => (
                            <option key={program.id} value={program.id}>
                                {program.title}
                            </option>
                        ))}
                    </select>
                </div>
                {formData.questions.map((question, qIndex) => (
                    <div key={qIndex} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: 'white' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>Question {qIndex + 1}</label>
                            <input
                                type="text"
                                style={{ 
                                    padding: '8px 16px', 
                                    border: '1px solid #e2e8f0', 
                                    borderRadius: '8px', 
                                    fontSize: '14px', 
                                    color: '#1e293b', 
                                    backgroundColor: 'white' 
                                }}
                                value={question.question_text}
                                onChange={(e) => handleChange(e, qIndex)}
                                name="question_text"
                                placeholder="Enter question"
                                required
                            />
                        </div>
                        {question.options.map((option, oIndex) => (
                            <div key={oIndex} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>Option {oIndex + 1}</label>
                                <input
                                    type="text"
                                    style={{ 
                                        padding: '8px 16px', 
                                        border: '1px solid #e2e8f0', 
                                        borderRadius: '8px', 
                                        fontSize: '14px', 
                                        color: '#1e293b', 
                                        backgroundColor: 'white' 
                                    }}
                                    value={option}
                                    onChange={(e) => handleChange(e, qIndex, oIndex)}
                                    name="option"
                                    placeholder={`Option ${oIndex + 1}`}
                                    required
                                />
                            </div>
                        ))}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>Correct Answer</label>
                            <input
                                type="text"
                                style={{ 
                                    padding: '8px 16px', 
                                    border: '1px solid #e2e8f0', 
                                    borderRadius: '8px', 
                                    fontSize: '14px', 
                                    color: '#1e293b', 
                                    backgroundColor: 'white' 
                                }}
                                value={question.correct_answer}
                                onChange={(e) => handleChange(e, qIndex)}
                                name="correct_answer"
                                placeholder="Enter correct answer"
                                required
                            />
                        </div>
                    </div>
                ))}
                <button 
                    type="button" 
                    style={{ 
                        padding: '8px 16px', 
                        backgroundColor: '#e2e8f0', 
                        color: '#1e293b', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        fontSize: '14px', 
                        fontWeight: '500' 
                    }}
                    onClick={addQuestion}
                >
                    Add Another Question
                </button>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                    <button 
                        type="submit" 
                        style={{ 
                            padding: '8px 16px', 
                            backgroundColor: '#1E88E5', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            fontSize: '14px', 
                            fontWeight: '500' 
                        }}
                    >
                        Create Quiz
                    </button>
                    <button 
                        type="button" 
                        style={{ 
                            padding: '8px 16px', 
                            backgroundColor: '#e2e8f0', 
                            color: '#1e293b', 
                            border: 'none', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            fontSize: '14px', 
                            fontWeight: '500' 
                        }}
                        onClick={() => navigate('/admin/programs')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateQuiz;