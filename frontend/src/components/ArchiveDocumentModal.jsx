import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const ArchiveDocumentModal = ({ isOpen, onClose, document, onArchive }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
    }
  }, [isOpen]);

  // Flatten nested folder hierarchy into a list with visual indentation
  const flattenFolders = (folderList, level = 0, parentPath = []) => {
    let result = [];
    folderList.forEach(folder => {
      const currentPath = [...parentPath, folder.name];
      const hasChildren = folder.children && folder.children.length > 0;
      
      // Create proper indentation
      let prefix = '';
      if (level > 0) {
        prefix = '\u00A0\u00A0'.repeat(level - 1) + '\u2514\u2500 ';
      }
      
      result.push({
        id: folder.id,
        name: folder.name,
        displayName: prefix + folder.name,
        level: level,
        path: currentPath.join(' › ')
      });
      
      if (hasChildren) {
        result = result.concat(flattenFolders(folder.children, level + 1, currentPath));
      }
    });
    return result;
  };

  const fetchFolders = async () => {
    try {
      const response = await api.get('/folders');
      const folderList = response.data.data?.folders || response.data.folders || [];
      setFolders(folderList);
    } catch (error) {
      console.error('Error fetching folders:', error);
      setError('Error fetching folders');
    }
  };
  
  // Get flattened folders for display
  const flatFolders = flattenFolders(folders);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFolder) {
      setError('Please select a folder for archiving');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/workflow/archive/${document.id}`, {
        folderId: parseInt(selectedFolder)
      });

      if (response.data) {
        onArchive(response.data.data.document);
        handleClose();
      }
    } catch (error) {
      console.error('Error archiving document:', error);
      setError(error.response?.data?.message || 'Failed to archive document');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFolder('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Archive Obsolete Document</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Code
                </label>
                <input
                  type="text"
                  value={document?.fileCode || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <input
                  type="text"
                  value={document?.status || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Title
              </label>
              <input
                type="text"
                value={document?.title || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Archive Folder <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              >
                <option value="">-- Select Folder --</option>
                {flatFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.displayName}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Choose the folder where this obsolete document should be archived.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will move the obsolete/superseded document to the selected folder for archival purposes. 
                The document will remain in its current status ({document?.status}) but will be organized in the archive folder.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Archiving...' : 'Archive Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArchiveDocumentModal;
