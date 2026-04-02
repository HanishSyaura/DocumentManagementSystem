import React, { useState, useEffect } from 'react';

const DiagnosticPage = () => {
  const [landingContent, setLandingContent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dms_landing_page_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setLandingContent(parsed);
      } else {
        setError('No landing page settings found in localStorage');
      }
    } catch (err) {
      setError(`Error parsing localStorage: ${err.message}`);
    }
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!landingContent) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Landing Page Settings Diagnostic</h1>
      
      {/* Contact Section Diagnostics */}
      <div className="border border-gray-300 rounded-lg p-6 mb-6 bg-white shadow">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Contact Section</h2>
        
        <div className="space-y-4">
          <div>
            <span className="font-bold">Contact Image Exists:</span>{' '}
            <span className={landingContent.contactImage ? 'text-green-600' : 'text-red-600'}>
              {landingContent.contactImage ? 'YES ✓' : 'NO ✗'}
            </span>
          </div>
          
          <div>
            <span className="font-bold">Contact Image Position:</span>{' '}
            <span className="text-blue-600">{landingContent.contactImagePosition || 'Not set'}</span>
          </div>
          
          {landingContent.contactImage && (
            <>
              <div>
                <span className="font-bold">Image Data Length:</span>{' '}
                <span className="text-green-600">{landingContent.contactImage.length} characters</span>
              </div>
              
              <div>
                <span className="font-bold">Image Format:</span>{' '}
                <span className="text-green-600">
                  {landingContent.contactImage.startsWith('data:image/') ? 
                    landingContent.contactImage.substring(0, 30) + '...' : 
                    'Invalid format (should start with data:image/)'}
                </span>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <span className="font-bold block mb-2">Image Preview:</span>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <img 
                    src={landingContent.contactImage} 
                    alt="Contact" 
                    className="max-h-64 w-auto object-contain mx-auto border-2 border-gray-300"
                    onError={(e) => {
                      e.target.parentElement.innerHTML = `<p class="text-red-600 font-bold">Image failed to load! The data might be corrupted.</p>`;
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* All Other Section Images */}
      <div className="border border-gray-300 rounded-lg p-6 bg-white shadow">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Other Section Images</h2>
        
        <div className="space-y-6">
          {/* Hero Image */}
          <div className="border-b pb-4">
            <h3 className="font-bold text-lg mb-2">Hero Image</h3>
            <p>Exists: <span className={landingContent.heroImage ? 'text-green-600' : 'text-red-600'}>
              {landingContent.heroImage ? 'YES' : 'NO'}
            </span></p>
            <p>Position: {landingContent.heroImagePosition}</p>
            {landingContent.heroImage && (
              <div className="mt-2 bg-gray-100 p-2 rounded">
                <img src={landingContent.heroImage} alt="Hero" className="max-h-32 w-auto object-contain" />
              </div>
            )}
          </div>

          {/* About Image */}
          <div className="border-b pb-4">
            <h3 className="font-bold text-lg mb-2">About Image</h3>
            <p>Exists: <span className={landingContent.aboutImage ? 'text-green-600' : 'text-red-600'}>
              {landingContent.aboutImage ? 'YES' : 'NO'}
            </span></p>
            <p>Position: {landingContent.aboutImagePosition}</p>
            {landingContent.aboutImage && (
              <div className="mt-2 bg-gray-100 p-2 rounded">
                <img src={landingContent.aboutImage} alt="About" className="max-h-32 w-auto object-contain" />
              </div>
            )}
          </div>

          {/* Workflow Image */}
          <div className="border-b pb-4">
            <h3 className="font-bold text-lg mb-2">Workflow Image</h3>
            <p>Exists: <span className={landingContent.workflowImage ? 'text-green-600' : 'text-red-600'}>
              {landingContent.workflowImage ? 'YES' : 'NO'}
            </span></p>
            <p>Position: {landingContent.workflowImagePosition}</p>
            {landingContent.workflowImage && (
              <div className="mt-2 bg-gray-100 p-2 rounded">
                <img src={landingContent.workflowImage} alt="Workflow" className="max-h-32 w-auto object-contain" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Raw JSON Data */}
      <div className="border border-gray-300 rounded-lg p-6 mt-6 bg-white shadow">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Raw Contact Section JSON</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify({
            contactTitle: landingContent.contactTitle,
            contactDescription: landingContent.contactDescription,
            contactEmails: landingContent.contactEmails,
            contactPhone: landingContent.contactPhone,
            contactImagePosition: landingContent.contactImagePosition,
            contactImageExists: !!landingContent.contactImage,
            contactImageLength: landingContent.contactImage ? landingContent.contactImage.length : 0
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default DiagnosticPage;
