import React from 'react';
import PropTypes from 'prop-types';

const JobListing = ({ job }) => {
  if (!job) {
    return null;
  }

  const { title, company, location, description, company_logo } = job;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-4 flex items-start">
      {company_logo && (
        <img src={company_logo} alt={`${company} logo`} className="w-16 h-16 mr-6" />
      )}
      <div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <p className="text-md text-gray-600">{company}</p>
        <p className="text-sm text-gray-500 mb-2">{location}</p>
        <p className="text-gray-700">{description}</p>
        <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Apply Now
        </button>
      </div>
    </div>
  );
};

JobListing.propTypes = {
  job: PropTypes.shape({
    title: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    company_logo: PropTypes.string,
  }).isRequired,
};

export default JobListing;
