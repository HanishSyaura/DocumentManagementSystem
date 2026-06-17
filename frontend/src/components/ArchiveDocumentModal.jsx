import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal, { ModalBody, ModalFooter, ModalHeader } from './ui/Modal';
import AppSurface from './ui/AppSurface';
import Button from './ui/Button';
import TextInput from './ui/TextInput';
import SelectField from './ui/SelectField';
import InlineSpinner from './ui/InlineSpinner';

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
    <Modal onClose={handleClose} closeOnBackdrop size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader title="Archive Obsolete Document" onClose={handleClose} />

        <ModalBody className="space-y-4">
          {error ? (
            <AppSurface variant="muted" padding="md" className="border border-red-200 bg-red-50 text-sm text-red-700">
              {error}
            </AppSurface>
          ) : null}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">
                  File Code
                </label>
                <TextInput
                  type="text"
                  value={document?.fileCode || ''}
                  disabled
                  className="bg-surface-muted text-ink-muted cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">
                  Status
                </label>
                <TextInput
                  type="text"
                  value={document?.status || ''}
                  disabled
                  className="bg-surface-muted text-ink-muted cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-2">
                Document Title
              </label>
              <TextInput
                type="text"
                value={document?.title || ''}
                disabled
                className="bg-surface-muted text-ink-muted cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-2">
                Select Archive Folder <span className="text-red-500">*</span>
              </label>
              <SelectField
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="font-mono"
                required
              >
                <option value="">-- Select Folder --</option>
                {flatFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.displayName}
                  </option>
                ))}
              </SelectField>
              <p className="mt-1 text-xs text-ink-muted">
                Choose the folder where this obsolete document should be archived.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will move the obsolete/superseded document to the selected folder for archival purposes. 
                The document will remain in its current status ({document?.status}) but will be organized in the archive folder.
              </p>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="flex-wrap justify-end">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <><InlineSpinner className="h-4 w-4 border-2 border-white/40 border-t-white" /><span>Archiving...</span></> : 'Archive Document'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default ArchiveDocumentModal;
