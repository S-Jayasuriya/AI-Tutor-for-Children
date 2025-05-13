// src/Whiteboard.js
import React, { useRef, useEffect, useState } from 'react';

const Whiteboard = () => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lineWidth, setLineWidth] = useState(5); // Default line width
    const [isErasing, setIsErasing] = useState(false); // State for eraser

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth * 0.4; // Set width to 40% of window width
        canvas.height = window.innerHeight * 0.5; // Set height to 50% of window height
        const context = canvas.getContext('2d');
        contextRef.current = context;
        context.lineCap = 'round';
        context.strokeStyle = 'black'; // Default color
        context.lineWidth = lineWidth; // Set initial line width
    }, [lineWidth]);

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.lineWidth = isErasing ? 20 : lineWidth; // Use a thicker line for erasing
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    const stopDrawing = () => {
        contextRef.current.closePath();
        setIsDrawing(false);
    };

    const increaseSize = () => {
        setLineWidth((prev) => Math.min(prev + 2, 20)); // Max size of 20
    };

    const decreaseSize = () => {
        setLineWidth((prev) => Math.max(prev - 2, 1)); // Min size of 1
    };

    const toggleEraser = () => {
        setIsErasing((prev) => !prev);
        contextRef.current.strokeStyle = isErasing ? 'black' : 'white'; // Toggle between black and white
    };

    return (
        <div><strong style={{ position:'relative',left:'35%'}}>Whiteboard</strong>
            <div style={{ marginBottom: '10px' }}>
                <button style={{ height: '40px', width: '50px', margin: '10px'}}onClick={increaseSize}>+</button>
                <button style={{ height: '40px', width: '50px', margin: '10px'}}onClick={decreaseSize}>-</button>
                <button onClick={toggleEraser}>{isErasing ? 'Use Pencil' : 'Use Eraser'}</button>
            </div>
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{ border: '1px solid black', cursor: 'crosshair' }}
            />
        </div>
    );
};

export default Whiteboard;