import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileId, setFileId] = useState(null);
  const [email, setEmail] = useState(null);

  useEffect(() => {
          const getemail = localStorage.getItem('email');
          if (getemail) {
              setEmail(getemail);
          }
      }, [localStorage.getItem('email')]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a PDF file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('fileName', fileName);
    formData.append('email', email); // Append the email to the form data

    try {
      const response = await axios.post('http://localhost:4001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert(response.data.message); // Assuming your backend sends a message
      setFileId(response.data.fileId);
      console.log(fileId);
      processVectors(response.data.fileId);
      alert(`File ID: ${fileId}, File Name: ${fileName}`);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("File upload failed.");
    }
  };

  async function processVectors(file_id) {
    try {
      const response1 = await axios.post('http://localhost:5000/process-vectors',{ "file_id": file_id }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      alert(response1.data.message); // Assuming your backend sends a message
    } catch (error) {
      console.error("File processing failed:", error);
      alert("File processing failed.");
    }
  }

  const handleNameChange = (e) => {
    setFileName(e.target.value);
  };

  return (
    <>
      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
        />

        <h4 style={{ margin: '5px'}}>Name your PDF</h4>
        <input 
          type="text" 
          className='input-box'
          value={fileName} 
          onChange={handleNameChange} 
          placeholder="Enter a name for your PDF" 
        />
        <button type="submit" className="submit-btn">Save</button>
      </form>
    </>
  );
};

export default UploadForm;