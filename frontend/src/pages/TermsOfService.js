import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';

const TermsOfService = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-ocean-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-ocean-700 hover:bg-ocean-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            <span className="text-sm font-medium">Back</span>
          </button>
          <a href="/" target="_self" className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2" aria-label="AMET Alumni Home">
            <Logo className="h-8 w-auto" />
            <span className="text-lg font-semibold text-gray-900">AMET Alumni</span>
          </a>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-gray-900">AMET Alumni Association — Terms and Conditions</h1>
          <div className="prose prose-lg max-w-none text-gray-700">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Preamble</h2>
              <p className="leading-relaxed">
                This Memorandum of Understanding (MoU) / Constitution outlines the objectives, rights, and obligations of the AMET Alumni Association (A3). Conceived in 2008 under the vision of the Founder Chancellor, Dr. J. Ramachandran, the Association represents over 15,000 registered alumni worldwide and functions as a bridge between alumni, students, and the University.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Objectives</h2>
              <p className="leading-relaxed mb-4">The Association is constituted with the following objectives:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Strengthen alumni engagement with AMET University and support its academic, cultural, and extracurricular growth.</li>
                <li>Provide scholarships, awards, career guidance, and mentorship for students.</li>
                <li>Raise funds, endowments, and welfare initiatives for the benefit of students and alumni.</li>
                <li>Promote professional collaboration, fellowship, and knowledge-sharing among alumni.</li>
                <li>Contribute to curriculum development through participation in Board of Studies and academic forums.</li>
                <li>Maintain a structured alumni database and communication portal for networking and career opportunities.</li>
                <li>Protect the collective interests of alumni while upholding the values of AMET.</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Governance</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>The Association shall function in accordance with its approved bylaws and governing rules.</li>
                <li>Office bearers shall be elected/appointed in compliance with the internal constitution of the Association.</li>
                <li>Annual General Meetings (AGM) shall be conducted to review progress and approve audited accounts.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Data Protection & Confidentiality</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Alumni data collected and maintained by the Association shall be used solely for alumni engagement, welfare, and institutional development.</li>
                <li>The Association shall comply with applicable data protection and privacy norms.</li>
                <li>No personal data shall be shared with third parties without explicit consent of the concerned alumni.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Termination & Dissolution</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>The Association may be dissolved in accordance with its bylaws and governing rules.</li>
                <li>Upon dissolution, after settlement of debts and liabilities, remaining assets shall be transferred to AMET University or a registered trust/society having similar objectives.</li>
              </ul>
            </section>

            <section className="mb-2">
              <h2 className="text-2xl font-semibold mb-4">6. Legal Jurisdiction</h2>
              <p className="leading-relaxed">
                This MoU/Constitution shall be governed by the laws of India, and any legal proceedings arising out of it shall fall within the jurisdiction of courts in Chennai, Tamil Nadu.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
