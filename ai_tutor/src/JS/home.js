import '../CSS/home.css';
import '../CSS/upload.css';
import '../CSS/book_box.css';
import UploadForm from './pdf_upload.js';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PDF from './pdf_page.js';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [files, setFiles] = useState([]);
    const [openPDFPage, setOpenPDFPage] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState(null);
    const navigate = useNavigate();

    const fetchFiles = async (email) => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:4001/files', { email });
            setFiles(response.data.files);
        } catch (error) {
            console.error("Error fetching files:", error);
            alert("Failed to fetch files.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const email = localStorage.getItem('email');
        if (email) {
            setEmail(email);
            fetchFiles(email);
        } else {
            navigate('/')
        }
    }, [localStorage.getItem('email')]);

    const handleClick = (e) => {
        e.preventDefault();
        // const url = `http://localhost:4001/uploads/${e.target.value}.pdf`;
        // navigate("/pdfpage", { state: { url: url } });
        navigate(`/pdfpage?url=${encodeURIComponent(e.target.value)}`); // Passing URL as query parameter
        // setPdfUrl(url);
        // setOpenPDFPage(true);
    };

    const handleDelete = async(file_id) => {
        const confirmed = window.confirm("Are you sure you want to delete this file?");
        if (confirmed) {
            try {
              const response = await fetch(`http://localhost:4001/delete/${file_id}`, {
                method: 'DELETE',
              });
      
              if (response.ok) {
                // If the file is deleted successfully, remove it from the UI (state)
                setFiles((prevFiles) => prevFiles.filter((file) => file.file_id !== file_id));
                alert('File deleted successfully!');
              } else {
                // Handle error if the deletion fails
                alert('Failed to delete the file.');
              }
            } catch (error) {
              console.error('Error deleting file:', error);
              alert('Error occurred while deleting the file.');
            }
        }
    }

    const closeModal = () => {
        const email = localStorage.getItem('email');
        setIsModalOpen(false);
        fetchFiles(email); // Refresh files when closing the modal
    };

    const signOut = () => {
        localStorage.removeItem('email');
    }

    return !openPDFPage ? (
        <div>
            <header className="header">
        <nav className="nav">
          <a href="#" className="nav_logo" style={{color:'black'}}>AI TUTOR FOR CHILD</a>
          <ul className="nav_items">
            <li className="nav_item">
            {/* <Router> */}
              <a href="/home" className="nav_link" style={{color:'black'}}>Home</a>
              {/* <Link to="/home" className="nav_link">Home</Link> */}
              <a href="/gamify" className="nav_link" style={{color:'black'}}>Gamify</a>
              <a href="#" className="nav_link" style={{color:'black'}}>Services</a>
              <a href="#" className="nav_link"style={{color:'black'}}>Contact</a>
              {/* </Router> */}
            </li>
          </ul>
          <a href='/' className="button-log" style={{paddingLeft: '30px', paddingRight: '30px', borderColor: 'black', color: 'black'}} onClick={signOut}>Sign-out</a>
        </nav>
      </header>
      <br/><br/><br/><hr/><br />
            {/* <h1>AI TUTOR FOR CHILD</h1> */}
            <div className="welcome">Welcome! {email}</div>
            <button className="uploadBtn" onClick={() => setIsModalOpen(true)}>UPLOAD PDF</button>
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <span className="close-button" onClick={closeModal}>&times;</span>
                        <h1>Upload a PDF</h1>
                        <UploadForm />
                    </div>
                </div>
            )}
            {isModalOpen && <div className="modal-background" onClick={closeModal} />}
            
            <div>
                <h2>Your Uploaded Files:</h2>
                {loading ? (
                    <div>Loading...</div>
                ) : files.length > 0 ? (
                    <ul>
                        {files.map(file => (
                            <div key={file.file_id} className='book_box'>
                                <span className="close-btn" onClick={() => handleDelete(file.file_id)}>&times;</span>
                                <button className='book_btn' value={file.file_id} onClick={handleClick}>Open</button>
                                <p>{file.file_name}</p>
                            </div>
                        ))}
                    </ul>
                ) : (
                    <p>No files uploaded yet.</p>
                )}
            </div>
        </div>
    ) : (
        <PDF url={pdfUrl} />
    );
};
export default Home;