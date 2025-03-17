// src/components/admin/quizzes/CreateQuiz.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import adminService from '../../../../services/adminService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import '../styles/CreateQuiz.css'; // Create this CSS file

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
        <div className="create-quiz">
            <div className="section-header">
                <h2><HelpCircle size={24} className="icon-inline" /> Create New Quiz</h2>
            </div>
            <form onSubmit={handleSubmit} className="quiz-form">
                <div className="form-group">
                    <label htmlFor="title">Quiz Title</label>
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
                    <label htmlFor="program_id">Program</label>
                    <select
                        id="program_id"
                        name="program_id"
                        value={formData.program_id}
                        onChange={handleChange}
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
                    <div key={qIndex} className="question-block">
                        <div className="form-group">
                            <label>Question {qIndex + 1}</label>
                            <input
                                type="text"
                                name="question_text"
                                value={question.question_text}
                                onChange={(e) => handleChange(e, qIndex)}
                                placeholder="Enter question"
                                required
                            />
                        </div>
                        {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="form-group">
                                <label>Option {oIndex + 1}</label>
                                <input
                                    type="text"
                                    name="option"
                                    value={option}
                                    onChange={(e) => handleChange(e, qIndex, oIndex)}
                                    placeholder={`Option ${oIndex + 1}`}
                                    required
                                />
                            </div>
                        ))}
                        <div className="form-group">
                            <label>Correct Answer</label>
                            <input
                                type="text"
                                name="correct_answer"
                                value={question.correct_answer}
                                onChange={(e) => handleChange(e, qIndex)}
                                placeholder="Enter correct answer"
                                required
                            />
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addQuestion} className="action-button secondary">
                    Add Another Question
                </button>
                <div className="form-actions">
                    <button type="submit" className="action-button primary">
                        Create Quiz
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

export default CreateQuiz;