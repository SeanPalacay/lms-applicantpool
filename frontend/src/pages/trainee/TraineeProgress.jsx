import React from 'react';

const TraineeDashboard = () => {
    return (
        <div>
            <h2>Trainee Dashboard</h2>
            <p>View your enrolled programs and progress here.</p>
            <div className="dashboard-cards">
                <div className="card">Enrolled Programs: 3</div>
                <div className="card">Completed Quizzes: 8</div>
            </div>
        </div>
    );
};

export default TraineeDashboard;