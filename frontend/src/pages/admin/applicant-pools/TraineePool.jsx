import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Search, RefreshCw, 
  Edit, Trash2, Users, CheckCircle, XCircle, Clock,
  Briefcase, Building
} from 'lucide-react';
import adminService from '../../../services/adminService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

const TraineePool = ({ onBack }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [positions, setPositions] = useState([
    { id: 1, name: 'HR Department Head', department: 'Human Resources', description: 'Oversees all HR operations and strategy', is_active: 1, created_at: '2025-03-25 09:17:02' },
    { id: 2, name: 'Employee Relations Specialist', department: 'Human Resources', description: 'Handles workplace disputes and employee engagement', is_active: 1, created_at: '2025-03-25 09:17:02' },
    { id: 7, name: 'Finance Department Head', department: 'Accounting and Finance', description: 'Leads financial strategy and compliance', is_active: 1, created_at: '2025-03-25 09:17:02' },
    { id: 10, name: 'Compliance Department Head', department: 'Compliance and Strategic Support', description: 'Ensures adherence to laws and regulations', is_active: 1, created_at: '2025-03-25 09:17:02' },
    { id: 15, name: 'CDS Department Head', department: 'Client Development and Services', description: 'Manages client relationships and service delivery', is_active: 1, created_at: '2025-03-25 09:17:02' },
    { id: 19, name: 'Internal Audit Department Head', department: 'Internal Audit', description: 'Oversees audit processes and reporting', is_active: 1, created_at: '2025-03-25 09:17:02' },
    { id: 22, name: 'General Services Staff', department: 'General Services', description: 'Handles maintenance, logistics, and administrative tasks', is_active: 1, created_at: '2025-03-25 09:17:02' },
    { id: 24, name: 'Operations Head', department: 'Operations', description: 'Leads overall operations', is_active: 1, created_at: '2025-03-25 09:17:02' }
  ]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [programs, setPrograms] = useState([
    { id: 1, title: 'HR Management' },
    { id: 2, title: 'Financial Strategy' },
    { id: 3, title: 'Compliance Training' },
    { id: 4, title: 'Client Services' },
    { id: 5, title: 'Audit Processes' },
    { id: 6, title: 'General Administration' },
    { id: 7, title: 'Operations Management' }
  ]);
  const [leaderboardData, setLeaderboardData] = useState({
    byBatch: {
      '1': [
        { user_id: 101, full_name: 'Alice Brown', position_name: 'HR Department Head', program_name: 'HR Management', score: 92.5, rank: 1, priority: true },
        { user_id: 102, full_name: 'Bob Carter', position_name: 'HR Department Head', program_name: 'HR Management', score: 88.0, rank: 2, priority: true },
        { user_id: 109, full_name: 'Charlie Wilson', position_name: 'HR Department Head', program_name: 'HR Management', score: 85.0, rank: 3, priority: true },
        { user_id: 110, full_name: 'Diana Taylor', position_name: 'HR Department Head', program_name: 'HR Management', score: 82.0, rank: 4, priority: true },
        { user_id: 111, full_name: 'Edward King', position_name: 'HR Department Head', program_name: 'HR Management', score: 78.0, rank: 5, priority: false }
      ],
      '2': [
        { user_id: 103, full_name: 'Clara Davis', position_name: 'Finance Department Head', program_name: 'Financial Strategy', score: 90.0, rank: 1, priority: true },
        { user_id: 112, full_name: 'Fiona Adams', position_name: 'Finance Department Head', program_name: 'Financial Strategy', score: 87.0, rank: 2, priority: true },
        { user_id: 113, full_name: 'George Baker', position_name: 'Finance Department Head', program_name: 'Financial Strategy', score: 84.0, rank: 3, priority: true },
        { user_id: 114, full_name: 'Hannah Clark', position_name: 'Finance Department Head', program_name: 'Financial Strategy', score: 81.0, rank: 4, priority: true },
        { user_id: 115, full_name: 'Ian Dunn', position_name: 'Finance Department Head', program_name: 'Financial Strategy', score: 77.0, rank: 5, priority: false }
      ],
      '3': [
        { user_id: 104, full_name: 'David Evans', position_name: 'Compliance Department Head', program_name: 'Compliance Training', score: 87.5, rank: 1, priority: true },
        { user_id: 116, full_name: 'Julia Ford', position_name: 'Compliance Department Head', program_name: 'Compliance Training', score: 83.0, rank: 2, priority: true },
        { user_id: 117, full_name: 'Kevin Gray', position_name: 'Compliance Department Head', program_name: 'Compliance Training', score: 80.0, rank: 3, priority: true },
        { user_id: 118, full_name: 'Laura Hill', position_name: 'Compliance Department Head', program_name: 'Compliance Training', score: 76.0, rank: 4, priority: true },
        { user_id: 119, full_name: 'Mark Ives', position_name: 'Compliance Department Head', program_name: 'Compliance Training', score: 73.0, rank: 5, priority: false }
      ],
      '4': [
        { user_id: 105, full_name: 'Emma Foster', position_name: 'CDS Department Head', program_name: 'Client Services', score: 91.0, rank: 1, priority: true },
        { user_id: 120, full_name: 'Nancy Jones', position_name: 'CDS Department Head', program_name: 'Client Services', score: 86.0, rank: 2, priority: true },
        { user_id: 121, full_name: 'Oliver King', position_name: 'CDS Department Head', program_name: 'Client Services', score: 82.0, rank: 3, priority: true },
        { user_id: 122, full_name: 'Paula Lee', position_name: 'CDS Department Head', program_name: 'Client Services', score: 79.0, rank: 4, priority: true },
        { user_id: 123, full_name: 'Quentin Moore', position_name: 'CDS Department Head', program_name: 'Client Services', score: 75.0, rank: 5, priority: false }
      ],
      '5': [
        { user_id: 106, full_name: 'Frank Green', position_name: 'Internal Audit Department Head', program_name: 'Audit Processes', score: 89.0, rank: 1, priority: true },
        { user_id: 124, full_name: 'Rachel Nelson', position_name: 'Internal Audit Department Head', program_name: 'Audit Processes', score: 85.0, rank: 2, priority: true },
        { user_id: 125, full_name: 'Samuel Owen', position_name: 'Internal Audit Department Head', program_name: 'Audit Processes', score: 81.0, rank: 3, priority: true },
        { user_id: 126, full_name: 'Tina Parker', position_name: 'Internal Audit Department Head', program_name: 'Audit Processes', score: 78.0, rank: 4, priority: true },
        { user_id: 127, full_name: 'Ursula Quinn', position_name: 'Internal Audit Department Head', program_name: 'Audit Processes', score: 74.0, rank: 5, priority: false }
      ],
      '6': [
        { user_id: 107, full_name: 'Grace Harris', position_name: 'General Services Staff', program_name: 'General Administration', score: 85.5, rank: 1, priority: true },
        { user_id: 128, full_name: 'Victor Reed', position_name: 'General Services Staff', program_name: 'General Administration', score: 82.0, rank: 2, priority: true },
        { user_id: 129, full_name: 'Wendy Scott', position_name: 'General Services Staff', program_name: 'General Administration', score: 78.0, rank: 3, priority: true },
        { user_id: 130, full_name: 'Xavier Thomas', position_name: 'General Services Staff', program_name: 'General Administration', score: 75.0, rank: 4, priority: true },
        { user_id: 131, full_name: 'Yvonne Upton', position_name: 'General Services Staff', program_name: 'General Administration', score: 72.0, rank: 5, priority: false }
      ],
      '7': [
        { user_id: 108, full_name: 'Henry Lee', position_name: 'Operations Head', program_name: 'Operations Management', score: 93.0, rank: 1, priority: true },
        { user_id: 132, full_name: 'Zara White', position_name: 'Operations Head', program_name: 'Operations Management', score: 89.0, rank: 2, priority: true },
        { user_id: 133, full_name: 'Adam Young', position_name: 'Operations Head', program_name: 'Operations Management', score: 85.0, rank: 3, priority: true },
        { user_id: 134, full_name: 'Bella Zane', position_name: 'Operations Head', program_name: 'Operations Management', score: 81.0, rank: 4, priority: true },
        { user_id: 135, full_name: 'Caleb York', position_name: 'Operations Head', program_name: 'Operations Management', score: 77.0, rank: 5, priority: false }
      ]
    },
    byPosition: {
      '1': [
        { user_id: 101, full_name: 'Alice Brown', batch_id: 1, program_name: 'HR Management', score: 92.5, rank: 1, priority: true, name: 'HR Department Head' },
        { user_id: 102, full_name: 'Bob Carter', batch_id: 1, program_name: 'HR Management', score: 88.0, rank: 2, priority: true, name: 'HR Department Head' },
        { user_id: 109, full_name: 'Charlie Wilson', batch_id: 1, program_name: 'HR Management', score: 85.0, rank: 3, priority: true, name: 'HR Department Head' },
        { user_id: 110, full_name: 'Diana Taylor', batch_id: 1, program_name: 'HR Management', score: 82.0, rank: 4, priority: true, name: 'HR Department Head' },
        { user_id: 111, full_name: 'Edward King', batch_id: 1, program_name: 'HR Management', score: 78.0, rank: 5, priority: false, name: 'HR Department Head' }
      ],
      '2': [
        { user_id: 136, full_name: 'Freddy Allen', batch_id: 1, program_name: 'HR Management', score: 87.0, rank: 1, priority: true, name: 'Employee Relations Specialist' },
        { user_id: 137, full_name: 'Gina Brooks', batch_id: 1, program_name: 'HR Management', score: 84.0, rank: 2, priority: true, name: 'Employee Relations Specialist' },
        { user_id: 138, full_name: 'Helen Cook', batch_id: 1, program_name: 'HR Management', score: 80.0, rank: 3, priority: true, name: 'Employee Relations Specialist' },
        { user_id: 139, full_name: 'Ivy Davis', batch_id: 1, program_name: 'HR Management', score: 76.0, rank: 4, priority: true, name: 'Employee Relations Specialist' },
        { user_id: 140, full_name: 'Jack Edwards', batch_id: 1, program_name: 'HR Management', score: 73.0, rank: 5, priority: false, name: 'Employee Relations Specialist' }
      ],
      '7': [
        { user_id: 103, full_name: 'Clara Davis', batch_id: 2, program_name: 'Financial Strategy', score: 90.0, rank: 1, priority: true, name: 'Finance Department Head' },
        { user_id: 112, full_name: 'Fiona Adams', batch_id: 2, program_name: 'Financial Strategy', score: 87.0, rank: 2, priority: true, name: 'Finance Department Head' },
        { user_id: 113, full_name: 'George Baker', batch_id: 2, program_name: 'Financial Strategy', score: 84.0, rank: 3, priority: true, name: 'Finance Department Head' },
        { user_id: 114, full_name: 'Hannah Clark', batch_id: 2, program_name: 'Financial Strategy', score: 81.0, rank: 4, priority: true, name: 'Finance Department Head' },
        { user_id: 115, full_name: 'Ian Dunn', batch_id: 2, program_name: 'Financial Strategy', score: 77.0, rank: 5, priority: false, name: 'Finance Department Head' }
      ],
      '10': [
        { user_id: 104, full_name: 'David Evans', batch_id: 3, program_name: 'Compliance Training', score: 87.5, rank: 1, priority: true, name: 'Compliance Department Head' },
        { user_id: 116, full_name: 'Julia Ford', batch_id: 3, program_name: 'Compliance Training', score: 83.0, rank: 2, priority: true, name: 'Compliance Department Head' },
        { user_id: 117, full_name: 'Kevin Gray', batch_id: 3, program_name: 'Compliance Training', score: 80.0, rank: 3, priority: true, name: 'Compliance Department Head' },
        { user_id: 118, full_name: 'Laura Hill', batch_id: 3, program_name: 'Compliance Training', score: 76.0, rank: 4, priority: true, name: 'Compliance Department Head' },
        { user_id: 119, full_name: 'Mark Ives', batch_id: 3, program_name: 'Compliance Training', score: 73.0, rank: 5, priority: false, name: 'Compliance Department Head' }
      ],
      '15': [
        { user_id: 105, full_name: 'Emma Foster', batch_id: 4, program_name: 'Client Services', score: 91.0, rank: 1, priority: true, name: 'CDS Department Head' },
        { user_id: 120, full_name: 'Nancy Jones', batch_id: 4, program_name: 'Client Services', score: 86.0, rank: 2, priority: true, name: 'CDS Department Head' },
        { user_id: 121, full_name: 'Oliver King', batch_id: 4, program_name: 'Client Services', score: 82.0, rank: 3, priority: true, name: 'CDS Department Head' },
        { user_id: 122, full_name: 'Paula Lee', batch_id: 4, program_name: 'Client Services', score: 79.0, rank: 4, priority: true, name: 'CDS Department Head' },
        { user_id: 123, full_name: 'Quentin Moore', batch_id: 4, program_name: 'Client Services', score: 75.0, rank: 5, priority: false, name: 'CDS Department Head' }
      ],
      '19': [
        { user_id: 106, full_name: 'Frank Green', batch_id: 5, program_name: 'Audit Processes', score: 89.0, rank: 1, priority: true, name: 'Internal Audit Department Head' },
        { user_id: 124, full_name: 'Rachel Nelson', batch_id: 5, program_name: 'Audit Processes', score: 85.0, rank: 2, priority: true, name: 'Internal Audit Department Head' },
        { user_id: 125, full_name: 'Samuel Owen', batch_id: 5, program_name: 'Audit Processes', score: 81.0, rank: 3, priority: true, name: 'Internal Audit Department Head' },
        { user_id: 126, full_name: 'Tina Parker', batch_id: 5, program_name: 'Audit Processes', score: 78.0, rank: 4, priority: true, name: 'Internal Audit Department Head' },
        { user_id: 127, full_name: 'Ursula Quinn', batch_id: 5, program_name: 'Audit Processes', score: 74.0, rank: 5, priority: false, name: 'Internal Audit Department Head' }
      ],
      '22': [
        { user_id: 107, full_name: 'Grace Harris', batch_id: 6, program_name: 'General Administration', score: 85.5, rank: 1, priority: true, name: 'General Services Staff' },
        { user_id: 128, full_name: 'Victor Reed', batch_id: 6, program_name: 'General Administration', score: 82.0, rank: 2, priority: true, name: 'General Services Staff' },
        { user_id: 129, full_name: 'Wendy Scott', batch_id: 6, program_name: 'General Administration', score: 78.0, rank: 3, priority: true, name: 'General Services Staff' },
        { user_id: 130, full_name: 'Xavier Thomas', batch_id: 6, program_name: 'General Administration', score: 75.0, rank: 4, priority: true, name: 'General Services Staff' },
        { user_id: 131, full_name: 'Yvonne Upton', batch_id: 6, program_name: 'General Administration', score: 72.0, rank: 5, priority: false, name: 'General Services Staff' }
      ],
      '24': [
        { user_id: 108, full_name: 'Henry Lee', batch_id: 7, program_name: 'Operations Management', score: 93.0, rank: 1, priority: true, name: 'Operations Head' },
        { user_id: 132, full_name: 'Zara White', batch_id: 7, program_name: 'Operations Management', score: 89.0, rank: 2, priority: true, name: 'Operations Head' },
        { user_id: 133, full_name: 'Adam Young', batch_id: 7, program_name: 'Operations Management', score: 85.0, rank: 3, priority: true, name: 'Operations Head' },
        { user_id: 134, full_name: 'Bella Zane', batch_id: 7, program_name: 'Operations Management', score: 81.0, rank: 4, priority: true, name: 'Operations Head' },
        { user_id: 135, full_name: 'Caleb York', batch_id: 7, program_name: 'Operations Management', score: 77.0, rank: 5, priority: false, name: 'Operations Head' }
      ]
    }
  });
  const [batchFilter, setBatchFilter] = useState('all');
  const [activePositionTab, setActivePositionTab] = useState('all');
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);

  useEffect(() => {
    fetchPositions();
    fetchPrograms();
  }, []);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const data = await adminService.getJobPositions();
      setPositions(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching job positions:', err);
      setError('Failed to load job positions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboardData = async (positionId) => {
    try {
      setLoading(true);
      const data = await adminService.getLeaderboardData(positionId);
      const updatedByPosition = Object.keys(data.byPosition).reduce((acc, posId) => {
        acc[posId] = data.byPosition[posId].map((trainee, index) => ({
          ...trainee,
          priority: index < 4
        }));
        return acc;
      }, {});
      setLeaderboardData({ ...data, byPosition: updatedByPosition });
      setError(null);
      const positionIds = Object.keys(updatedByPosition);
      setActivePositionTab(positionIds.length > 0 ? positionIds[0] : 'all');
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to load leaderboard data. Please try again.');
      setLeaderboardData({ byBatch: {}, byPosition: {} });
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const data = await adminService.getPrograms();
      setPrograms(data);
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  };

  const handleSelectPosition = async (position) => {
    try {
      setLoading(true);
      const trainees = await adminService.getTraineesByPool(position.id);
      console.log('Raw trainees for position', position.id, trainees);

      // Mock trainees data for each position
      const mockTrainees = {
        1: [ // HR Department Head
          { user_id: 101, full_name: 'Alice Brown', program_id: 1, program_name: 'HR Management', batch_id: 1, status: 'active', added_at: '2025-04-01' },
          { user_id: 102, full_name: 'Bob Carter', program_id: 1, program_name: 'HR Management', batch_id: 1, status: 'pending', added_at: '2025-03-15' },
          { user_id: 109, full_name: 'Charlie Wilson', program_id: 1, program_name: 'HR Management', batch_id: 1, status: 'active', added_at: '2025-02-10' },
          { user_id: 110, full_name: 'Diana Taylor', program_id: 1, program_name: 'HR Management', batch_id: 1, status: 'inactive', added_at: '2025-01-20' },
          { user_id: 111, full_name: 'Edward King', program_id: 1, program_name: 'HR Management', batch_id: 1, status: 'active', added_at: '2025-03-01' }
        ],
        2: [ // Employee Relations Specialist
          { user_id: 136, full_name: 'Freddy Allen', program_id: 1, program_name: 'HR Management', batch_id: 1, status: 'active', added_at: '2025-03-01' },
          { user_id: 137, full_name: 'Gina Brooks', program_id: 1, program_name: 'HR Management', batch_id: 1, status: 'pending', added_at: '2025-02-15' },
          { user_id: 138, full_name: 'Helen Cook', program_id: 1, program_name: 'HR Management', batch_id: 1, status: 'active', added_at: '2025-01-10' },
          { user_id: 139, full_name: 'Ivy Davis', program_id: 1, program_name: 'HR Management', batch_id: 1, status: 'inactive', added_at: '2025-04-05' },
          { user_id: 140, full_name: 'Jack Edwards', program_id: 1, program_name: 'HR Management', batch_id: 1, status: 'active', added_at: '2025-03-20' }
        ],
        7: [ // Finance Department Head
          { user_id: 103, full_name: 'Clara Davis', program_id: 2, program_name: 'Financial Strategy', batch_id: 2, status: 'active', added_at: '2025-02-15' },
          { user_id: 112, full_name: 'Fiona Adams', program_id: 2, program_name: 'Financial Strategy', batch_id: 2, status: 'pending', added_at: '2025-01-10' },
          { user_id: 113, full_name: 'George Baker', program_id: 2, program_name: 'Financial Strategy', batch_id: 2, status: 'active', added_at: '2025-04-05' },
          { user_id: 114, full_name: 'Hannah Clark', program_id: 2, program_name: 'Financial Strategy', batch_id: 2, status: 'inactive', added_at: '2025-03-20' },
          { user_id: 115, full_name: 'Ian Dunn', program_id: 2, program_name: 'Financial Strategy', batch_id: 2, status: 'active', added_at: '2025-02-25' }
        ],
        10: [ // Compliance Department Head
          { user_id: 104, full_name: 'David Evans', program_id: 3, program_name: 'Compliance Training', batch_id: 3, status: 'pending', added_at: '2025-01-10' },
          { user_id: 116, full_name: 'Julia Ford', program_id: 3, program_name: 'Compliance Training', batch_id: 3, status: 'active', added_at: '2025-04-05' },
          { user_id: 117, full_name: 'Kevin Gray', program_id: 3, program_name: 'Compliance Training', batch_id: 3, status: 'inactive', added_at: '2025-03-20' },
          { user_id: 118, full_name: 'Laura Hill', program_id: 3, program_name: 'Compliance Training', batch_id: 3, status: 'active', added_at: '2025-02-25' },
          { user_id: 119, full_name: 'Mark Ives', program_id: 3, program_name: 'Compliance Training', batch_id: 3, status: 'pending', added_at: '2025-01-15' }
        ],
        15: [ // CDS Department Head
          { user_id: 105, full_name: 'Emma Foster', program_id: 4, program_name: 'Client Services', batch_id: 4, status: 'active', added_at: '2025-04-05' },
          { user_id: 120, full_name: 'Nancy Jones', program_id: 4, program_name: 'Client Services', batch_id: 4, status: 'pending', added_at: '2025-03-20' },
          { user_id: 121, full_name: 'Oliver King', program_id: 4, program_name: 'Client Services', batch_id: 4, status: 'active', added_at: '2025-02-25' },
          { user_id: 122, full_name: 'Paula Lee', program_id: 4, program_name: 'Client Services', batch_id: 4, status: 'inactive', added_at: '2025-01-15' },
          { user_id: 123, full_name: 'Quentin Moore', program_id: 4, program_name: 'Client Services', batch_id: 4, status: 'active', added_at: '2025-04-01' }
        ],
        19: [ // Internal Audit Department Head
          { user_id: 106, full_name: 'Frank Green', program_id: 5, program_name: 'Audit Processes', batch_id: 5, status: 'active', added_at: '2025-03-20' },
          { user_id: 124, full_name: 'Rachel Nelson', program_id: 5, program_name: 'Audit Processes', batch_id: 5, status: 'pending', added_at: '2025-02-25' },
          { user_id: 125, full_name: 'Samuel Owen', program_id: 5, program_name: 'Audit Processes', batch_id: 5, status: 'active', added_at: '2025-01-15' },
          { user_id: 126, full_name: 'Tina Parker', program_id: 5, program_name: 'Audit Processes', batch_id: 5, status: 'inactive', added_at: '2025-04-01' },
          { user_id: 127, full_name: 'Ursula Quinn', program_id: 5, program_name: 'Audit Processes', batch_id: 5, status: 'active', added_at: '2025-03-15' }
        ],
        22: [ // General Services Staff
          { user_id: 107, full_name: 'Grace Harris', program_id: 6, program_name: 'General Administration', batch_id: 6, status: 'pending', added_at: '2025-02-25' },
          { user_id: 128, full_name: 'Victor Reed', program_id: 6, program_name: 'General Administration', batch_id: 6, status: 'active', added_at: '2025-01-15' },
          { user_id: 129, full_name: 'Wendy Scott', program_id: 6, program_name: 'General Administration', batch_id: 6, status: 'inactive', added_at: '2025-04-01' },
          { user_id: 130, full_name: 'Xavier Thomas', program_id: 6, program_name: 'General Administration', batch_id: 6, status: 'active', added_at: '2025-03-15' },
          { user_id: 131, full_name: 'Yvonne Upton', program_id: 6, program_name: 'General Administration', batch_id: 6, status: 'pending', added_at: '2025-02-10' }
        ],
        24: [ // Operations Head
          { user_id: 108, full_name: 'Henry Lee', program_id: 7, program_name: 'Operations Management', batch_id: 7, status: 'active', added_at: '2025-01-15' },
          { user_id: 132, full_name: 'Zara White', program_id: 7, program_name: 'Operations Management', batch_id: 7, status: 'pending', added_at: '2025-04-01' },
          { user_id: 133, full_name: 'Adam Young', program_id: 7, program_name: 'Operations Management', batch_id: 7, status: 'active', added_at: '2025-03-15' },
          { user_id: 134, full_name: 'Bella Zane', program_id: 7, program_name: 'Operations Management', batch_id: 7, status: 'inactive', added_at: '2025-02-10' },
          { user_id: 135, full_name: 'Caleb York', program_id: 7, program_name: 'Operations Management', batch_id: 7, status: 'active', added_at: '2025-01-20' }
        ]
      };

      const positionTrainees = mockTrainees[position.id] || [];
      setSelectedPosition({ ...position, trainees: trainees.length > 0 ? trainees : positionTrainees });
      await fetchLeaderboardData(position.id);
      setBatchFilter('all');
      setStatusFilter('all');
      setProgramFilter('all');
      setShowPriorityOnly(false);
    } catch (err) {
      console.error('Error fetching trainees for position:', err);
      setError(`Failed to load trainees for ${position.name}. Please try again.`);
      setSelectedPosition({ ...position, trainees: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      await adminService.updateTraineeStatus(userId, newStatus);
      if (selectedPosition && selectedPosition.trainees) {
        setSelectedPosition({
          ...selectedPosition,
          trainees: selectedPosition.trainees.map(trainee => 
            trainee.user_id === userId ? { ...trainee, status: newStatus } : trainee
          )
        });
        await fetchLeaderboardData(selectedPosition.id);
      }
    } catch (err) {
      console.error('Error updating trainee status:', err);
      alert('Failed to update trainee status. Please try again.');
    }
  };

  const handleDeletePosition = async (positionId) => {
    if (window.confirm('Are you sure you want to delete this job position?')) {
      try {
        setLoading(true);
        await adminService.deletePosition(positionId);
        await fetchPositions();
        if (selectedPosition && selectedPosition.id === positionId) {
          setSelectedPosition(null);
          setLeaderboardData({ byBatch: {}, byPosition: {} });
          setActivePositionTab('all');
        }
      } catch (err) {
        setError('Failed to delete job position. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveFromPool = async (userId) => {
    if (window.confirm('Are you sure you want to remove this trainee from the job position?')) {
      try {
        await adminService.removeTraineeFromPool(userId, selectedPosition.id);
        if (selectedPosition) {
          setSelectedPosition({
            ...selectedPosition,
            trainees: selectedPosition.trainees.filter(trainee => trainee.user_id !== userId)
          });
        }
        await fetchLeaderboardData(selectedPosition.id);
        alert('Trainee successfully removed from the job position.');
      } catch (err) {
        console.error('Error removing trainee from position:', err);
        alert('Failed to remove trainee from position. Please try again.');
      }
    }
  };

  const handleRefresh = () => {
    fetchPositions();
    if (selectedPosition) {
      handleSelectPosition(selectedPosition);
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const filteredPositions = searchTerm
    ? positions.filter(position => 
        position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (position.description && position.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : positions;

  const getFilteredTrainees = () => {
    if (!selectedPosition || !selectedPosition.trainees) return [];
    let trainees = [...selectedPosition.trainees];
    console.log('Initial trainees count:', trainees.length);

    // Apply filters
    if (statusFilter !== 'all') {
      trainees = trainees.filter(trainee => trainee.status === statusFilter);
      console.log('After status filter:', trainees.length);
    }
    if (programFilter !== 'all') {
      trainees = trainees.filter(trainee => trainee.program_id === parseInt(programFilter));
      console.log('After program filter:', trainees.length);
    }
    if (batchFilter !== 'all') {
      trainees = trainees.filter(trainee => trainee.batch_id === parseInt(batchFilter));
      console.log('After batch filter:', trainees.length);
    }
    if (showPriorityOnly) {
      const priorityTraineeIds = Object.values(leaderboardData.byPosition)
        .flat()
        .filter(trainee => trainee.priority)
        .map(trainee => trainee.user_id);
      trainees = trainees.filter(trainee => priorityTraineeIds.includes(trainee.user_id));
      console.log('After priority filter:', trainees.length);
    }

    // Fallback to raw trainees if no leaderboard data
    if (trainees.length === 0 && Object.values(leaderboardData.byPosition).flat().length === 0) {
      trainees = [...selectedPosition.trainees];
      console.log('Fallback to raw trainees count:', trainees.length);
    }

    return trainees.map(trainee => ({
      ...trainee,
      rank: null,
      priority: false
    }));
  };

  if (loading && positions.length === 0) return <LoadingSpinner />;

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'undefined') {
      return 'No date available';
    }
    const formattedDate = new Date(dateString);
    if (isNaN(formattedDate.getTime())) {
      return 'Invalid Date';
    }
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return formattedDate.toLocaleDateString(undefined, options);
  };

  const getBatchOptions = () => {
    const batches = selectedPosition?.trainees
      ? [...new Set(selectedPosition.trainees.map(trainee => trainee.batch_id))].filter(id => id)
      : [];
    return [
      { value: 'all', label: 'All Batches' },
      ...batches.map(batchId => ({
        value: batchId,
        label: `Batch ${batchId}`
      }))
    ];
  };

  const getPositionTabs = () => {
    return [
      { value: 'all', label: 'All Positions' },
      ...Object.keys(leaderboardData.byPosition).map(positionId => ({
        value: positionId,
        label: leaderboardData.byPosition[positionId][0]?.name || `Position ${positionId}`
      }))
    ];
  };

  const renderLeaderboardTabs = () => {
    const tabs = getPositionTabs();
    return (
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
          Leaderboard for {selectedPosition.name}
        </h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActivePositionTab(tab.value)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderBottom: activePositionTab === tab.value ? '2px solid #1E88E5' : 'none',
                background: 'none',
                color: activePositionTab === tab.value ? '#1E88E5' : '#64748b',
                fontSize: '0.875rem',
                fontWeight: activePositionTab === tab.value ? 600 : 400,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '0.875rem',
            marginBottom: '16px',
            minWidth: '200px'
          }}
        >
          {getBatchOptions().map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#E3F2FD', borderBottom: '1px solid #e2e8f0' }}>
                {['Rank', 'Trainee', 'Batch', 'Program', 'Score', 'Priority'].map((header, index) => (
                  <th key={index} style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activePositionTab !== 'all' && leaderboardData.byPosition[activePositionTab] ? (
                leaderboardData.byPosition[activePositionTab]
                  .filter(trainee => batchFilter === 'all' || trainee.batch_id === parseInt(batchFilter))
                  .map(trainee => (
                    <tr key={trainee.user_id} style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: trainee.priority ? '#e6ffe6' : '#ffffff'
                    }}>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>{trainee.rank}</td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>{trainee.full_name}</td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>Batch {trainee.batch_id || 'N/A'}</td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>{trainee.program_name || 'N/A'}</td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                        {trainee.score ? trainee.score.toFixed(2) : 'N/A'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                        {trainee.priority ? 'High Priority' : 'Standard'}
                      </td>
                    </tr>
                  ))
              ) : (
                Object.values(leaderboardData.byPosition)
                  .flat()
                  .filter(trainee => batchFilter === 'all' || trainee.batch_id === parseInt(batchFilter))
                  .sort((a, b) => a.rank - b.rank)
                  .map(trainee => (
                    <tr key={trainee.user_id} style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: trainee.priority ? '#e6ffe6' : '#ffffff'
                    }}>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>{trainee.rank}</td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>{trainee.full_name}</td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>Batch {trainee.batch_id || 'N/A'}</td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>{trainee.program_name || 'N/A'}</td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                        {trainee.score ? trainee.score.toFixed(2) : 'N/A'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                        {trainee.priority ? 'High Priority' : 'Standard'}
                      </td>
                    </tr>
                  ))
              )}
              {activePositionTab !== 'all' && (!leaderboardData.byPosition[activePositionTab] || leaderboardData.byPosition[activePositionTab].length === 0) && (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                    No trainees found for this position.
                  </td>
                </tr>
              )}
              {activePositionTab === 'all' && Object.values(leaderboardData.byPosition).flat().length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                    No leaderboard data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b'
    }}>
      {error && (
        <div style={{
          backgroundColor: '#ffe6e6',
          color: '#e74c3c',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '32px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
        }}>
          {error}
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onBack} style={{
            background: 'none',
            border: 'none',
            color: '#1E88E5',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            transition: 'color 0.3s ease'
          }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>Job Position Pools</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search job positions..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                padding: '8px 8px 8px 36px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none',
                minWidth: '200px'
              }}
            />
          </div>
          <button onClick={handleRefresh} style={{
            backgroundColor: '#ffffff',
            color: '#1E88E5',
            padding: '8px',
            border: '1px solid #1E88E5',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}>
            <RefreshCw size={16} />
          </button>
          <button onClick={() => navigate('/admin/positions/create')} style={{
            backgroundColor: '#1E88E5',
            color: '#ffffff',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem'
          }}>
            <Plus size={16} /> Create Position
          </button>
        </div>
      </div>

      {/* Position Content */}
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        {/* Positions List */}
        <div style={{
          flex: '1 1 300px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          padding: '24px'
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
            Job Positions
          </h2>
          {filteredPositions.length === 0 && !loading ? (
            <p style={{ color: '#64748b', textAlign: 'center' }}>No positions found.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {filteredPositions.map(position => (
                <li
                  key={position.id}
                  onClick={() => handleSelectPosition(position)}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    backgroundColor: selectedPosition?.id === position.id ? '#E3F2FD' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Briefcase size={16} color="#64748b" />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>
                        {position.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building size={16} color="#64748b" />
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {position.department || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/positions/edit/${position.id}`);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#1E88E5'
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePosition(position.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#e74c3c'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Selected Position Details */}
        <div style={{ flex: '2 1 600px' }}>
          {selectedPosition ? (
            <>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                padding: '24px',
                marginBottom: '32px'
              }}>
                <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
                  {selectedPosition.name}
                </h2>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: '#64748b' }}>
                      Department
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>
                      {selectedPosition.department || 'N/A'}
                    </p>
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: '#64748b' }}>
                      Trainees
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>
                      {selectedPosition.trainees?.length || 0}
                    </p>
                  </div>
                </div>
                {selectedPosition.description && (
                  <div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: '#64748b' }}>
                      Description
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e293b' }}>
                      {selectedPosition.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Filters */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                padding: '24px',
                marginBottom: '32px'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                  Filter Trainees
                </h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: '#64748b', marginBottom: '8px' }}>
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: '#64748b', marginBottom: '8px' }}>
                      Program
                    </label>
                    <select
                      value={programFilter}
                      onChange={(e) => setProgramFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="all">All Programs</option>
                      {programs.map(program => (
                        <option key={program.id} value={program.id}>{program.title}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: '#64748b', marginBottom: '8px' }}>
                      Priority
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={showPriorityOnly}
                        onChange={(e) => setShowPriorityOnly(e.target.checked)}
                      />
                      Show Priority Only
                    </label>
                  </div>
                </div>
              </div>

              {/* Trainee Table */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                padding: '24px'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                  Trainees
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#E3F2FD', borderBottom: '1px solid #e2e8f0' }}>
                        {['Name', 'Program', 'Batch', 'Status', 'Added', 'Actions'].map((header, index) => (
                          <th key={index} style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#1e293b'
                          }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredTrainees().length > 0 ? (
                        getFilteredTrainees().map(trainee => (
                          <tr key={trainee.user_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '16px', fontSize: '0.875rem' }}>{trainee.full_name}</td>
                            <td style={{ padding: '16px', fontSize: '0.875rem' }}>{trainee.program_name || 'N/A'}</td>
                            <td style={{ padding: '16px', fontSize: '0.875rem' }}>Batch {trainee.batch_id || 'N/A'}</td>
                            <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                              <select
                                value={trainee.status || 'active'} // Default to 'active' if no status
                                onChange={(e) => handleUpdateStatus(trainee.user_id, e.target.value)}
                                style={{
                                  padding: '4px',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '4px',
                                  fontSize: '0.875rem'
                                }}
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                              </select>
                            </td>
                            <td style={{ padding: '16px', fontSize: '0.875rem' }}>{formatDate(trainee.added_at)}</td>
                            <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                              <button
                                onClick={() => handleRemoveFromPool(trainee.user_id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#e74c3c'
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                            No trainees found. Try adjusting the filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {renderLeaderboardTabs()}
            </>
          ) : (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              padding: '24px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              Select a job position to view details and trainees.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TraineePool;