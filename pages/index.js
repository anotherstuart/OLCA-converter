import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card'

const FormatConverter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [conversionType, setConversionType] = useState('toHugin');

  const [inputFilename, setInputFilename] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setInputFilename(file.name);
      const reader = new FileReader();
      reader.onload = (e) => setInput(e.target.result);
      reader.readAsText(file);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "application/octet-stream" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const prefix = conversionType === 'toHugin' ? 'OLCA2Hugin-' : 'Hugin2OLCA-';
    const outputFilename = inputFilename || 'converted.net';
    link.download = prefix + outputFilename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const convertFormat = () => {
    const lines = input.split('\n');
    const outputLines = [];
    const toHugin = conversionType === 'toHugin';
    
    if (!toHugin) {
      outputLines.push("File generated in OLCATool", "");
    }
    
    let inNodeDef = false;
    let lastLineCurlyBrace = false;
    
    lines.forEach(line => {
      if (toHugin && line.startsWith('File generated')) {
        return;
      }
      
      const trimmedLine = line.trim();

      if (trimmedLine === '}') {
        lastLineCurlyBrace = true;
        outputLines.push(line);
        return;
      }
      
      if (lastLineCurlyBrace && trimmedLine !== '') {
        outputLines.push('');
        lastLineCurlyBrace = false;
      }
      
      if (trimmedLine === '') {
        return;
      }
      
      if (trimmedLine.startsWith('node')) {
        inNodeDef = true;
        outputLines.push(line);
      } else if (inNodeDef && trimmedLine.startsWith('states')) {
        const statesLine = line.split('(')[0];
        const states = line.split('(')[1].split(')')[0].trim();
        
        let newStates;
        if (toHugin) {
          // Convert from OLCA to Hugin format
          newStates = states.split(',').map(s => s.trim()).join(' ');
        } else {
          // Convert from Hugin to OLCA format
          newStates = states.split(/\s+/).join(', ');
        }
        
        outputLines.push(`${statesLine}(${newStates});`);
      } else if (toHugin && line.includes('| )')) {
        outputLines.push(line.replace(/\| \)/g, '|)'));
      } else if (!toHugin && line.includes('|)')) {
        outputLines.push(line.replace(/\|\)/g, '| )'));
      } else {
        outputLines.push(line);
      }
    });
    
    setOutput(outputLines.join('\n'));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block mb-2">
              <input 
                type="radio"
                name="conversionType"
                value="toHugin"
                checked={conversionType === 'toHugin'}
                onChange={(e) => setConversionType(e.target.value)}
                className="mr-2"
              />
              OLCA to Hugin (Genie)
            </label>
            <label className="block mb-2">
              <input 
                type="radio"
                name="conversionType"
                value="toOLCA"
                checked={conversionType === 'toOLCA'}
                onChange={(e) => setConversionType(e.target.value)}
                className="mr-2"
              />
              Hugin (Genie) to OLCA
            </label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".net"
                className="block w-full"
              />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-96 p-2 border rounded"
                placeholder="Paste input .net file here or use file upload"
              />
            </div>
            
            <div className="space-y-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
                disabled={!output}
              >
                Download Output File
              </button>
              <textarea
                value={output}
                readOnly
                className="w-full h-96 p-2 border rounded bg-gray-50"
                placeholder="Converted output will appear here"
              />
            </div>
          </div>
          
          <button
            onClick={convertFormat}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Convert
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormatConverter;
