import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import LoadingScreen from '../common/LoadingScreen';

/**
 * EmployerGuard component handles role-based access control for employer accounts.
 * It ensures employers only have access to their own company profile and job listings.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if access is granted
 * @param {string} props.companyId - Optional company ID to check if the employer is associated with it
 * @param {string} props.jobId - Optional job ID to check if the employer is the owner
 * @param {boolean} props.strict - If true, redirects non-employers to home, otherwise allows them through
 * @param {string} props.fallbackPath - Path to redirect to if access is denied (defaults to '/jobs')
 * @returns {React.ReactNode} - The protected children or a redirect
 */
const EmployerGuard = ({ 
  children, 
  companyId, 
  jobId, 
  strict = false,
  fallbackPath = '/jobs'
}) => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkEmployerAccess = async () => {
      if (authLoading || !user) {
        setLoading(false);
        return;
      }

      try {
        // Basic role check
        const isEmployer = profile?.role === 'employer';
        
        // If not an employer and strict mode is on, deny access
        if (!isEmployer && strict) {
          setHasAccess(false);
          setLoading(false);
          return;
        }
        
        // If not an employer but strict mode is off, allow access
        if (!isEmployer && !strict) {
          setHasAccess(true);
          setLoading(false);
          return;
        }
        
        // For employers, we need to check company/job ownership
        if (isEmployer) {
          // Get the employer's company ID
          const { data: employerCompany, error: companyError } = await supabase
            .from('companies')
            .select('id')
            .eq('created_by', user.id)
            .single();
            
          if (companyError && companyError.code !== 'PGRST116') {
            console.error('Error fetching employer company:', companyError);
            setHasAccess(false);
            setLoading(false);
            return;
          }
          
          const employerCompanyId = employerCompany?.id;
          
          // If no specific company/job ID is required, just check if they have a company
          if (!companyId && !jobId) {
            setHasAccess(!!employerCompanyId);
            setLoading(false);
            return;
          }
          
          // Check company access if companyId is provided
          if (companyId) {
            setHasAccess(companyId === employerCompanyId);
            setLoading(false);
            return;
          }
          
          // Check job ownership if jobId is provided
          if (jobId) {
            const { data: jobData, error: jobError } = await supabase
              .from('jobs')
              .select('company_id')
              .eq('id', jobId)
              .single();
              
            if (jobError) {
              console.error('Error fetching job data:', jobError);
              setHasAccess(false);
              setLoading(false);
              return;
            }
            
            // Check if the job belongs to the employer's company
            setHasAccess(jobData.company_id === employerCompanyId);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error in employer access check:', error);
        setHasAccess(false);
      }
      
      setLoading(false);
    };

    checkEmployerAccess();
  }, [user, profile, authLoading, companyId, jobId, strict]);

  if (loading || authLoading) {
    return <LoadingScreen />;
  }

  // If user doesn't have access and strict mode is on, redirect
  if (!hasAccess && strict) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // For non-strict mode or if user has access, render children
  return children;
};

export default EmployerGuard;
