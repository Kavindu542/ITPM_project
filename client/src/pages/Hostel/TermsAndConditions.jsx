import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function HostelTermsAndConditions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 text-gray-700" />
            <span className="font-medium text-gray-800">Back</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
          <div className="p-6 border-b border-gray-200 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hostel Terms and Conditions</h1>
              <p className="text-sm text-gray-500">Please read carefully before submitting your application</p>
            </div>
          </div>

          <div className="p-6 space-y-4 text-gray-700">
            <p>
              These Terms and Conditions govern the use of university hostel facilities. By applying for hostel accommodation,
              you agree to abide by all rules, regulations, and policies issued by the hostel administration.
            </p>

            <ol className="list-decimal pl-6 space-y-3">
              <li><span className="font-medium">Eligibility:</span> Hostel accommodation is available to registered students only and is subject to availability and approval.</li>
              <li><span className="font-medium">Conduct:</span> Residents must maintain discipline, respect other residents, and comply with quiet hours and safety rules.</li>
              <li><span className="font-medium">Facilities:</span> Residents are responsible for proper use of facilities and liable for damages caused by negligence or misuse.</li>
              <li><span className="font-medium">Payments:</span> Fees must be paid on time. Late payments may result in penalties or termination of accommodation.</li>
              <li><span className="font-medium">Visitors:</span> Visitor policies must be strictly followed. Unauthorized overnight visitors are prohibited.</li>
              <li><span className="font-medium">Prohibited Items:</span> Hazardous materials, illegal substances, and appliances not permitted by hostel policy are strictly forbidden.</li>
              <li><span className="font-medium">Security:</span> Residents must keep rooms secure and report any suspicious activity to the administration.</li>
              <li><span className="font-medium">Termination:</span> Violation of these terms may result in disciplinary action, including eviction from the hostel.</li>
            </ol>

            <p>
              By returning to the application and checking the consent box, you confirm that you have read and agree to these Terms and Conditions.
            </p>

            <div className="pt-2">
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => navigate('/hostel?view=apply')}
              >
                I Understand, Return to Application
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}